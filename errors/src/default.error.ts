import { IDataInfo } from '@nestjs-yalc/event-manager/event.js';
import { getGlobalEventEmitter } from '@nestjs-yalc/event-manager/global-emitter.js';
import type { ImprovedLoggerService } from '@nestjs-yalc/logger/logger-abstract.service.js';
import { AppLoggerFactory } from '@nestjs-yalc/logger/logger.factory.js';
import { maskDataInObject } from '@nestjs-yalc/logger/logger.helper.js';
import { ClassType, Mixin } from '@nestjs-yalc/types/globals.d.js';
import { getHttpStatusDescription } from '@nestjs-yalc/utils/http.helper.js';
import {
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
  LogLevel,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { isNativeError } from 'util/types';
import { ErrorsEnum, getHttpStatusNameByCode } from './error.enum.js';

export const ON_DEFAULT_ERROR_EVENT = 'onDefaultError';

export interface IErrorPayload {
  /**
   * The data that will be used internally. It can contain sensitive data.
   */
  data?: IDataInfo;
  /**
   * The message that will be used internally. It can contain sensitive data.
   */
  internalMessage?: string;
  /**
   * The response that can be sent to the client. It can be a string or an object (including an error object)
   * It must not contain sensitive data.
   */
  response?: string | Record<string, any>;
  /**
   * Human readable description of the error code
   */
  description?: string;
  /**
   * Http status code or a custom error code
   */
  errorCode?: HttpStatus | number;
  /**
   * The original cause of the error.
   */
  cause?: Error | unknown;
}

type loggerOptionType =
  | { instance?: ImprovedLoggerService; level?: LogLevel }
  | false;

export interface IAbstractDefaultError
  extends Omit<HttpException, 'cause'>,
    Omit<IErrorPayload, 'response'> {
  logger?: loggerOptionType;
  eventEmitter?: EventEmitter2;
  eventName?: string;
}

export interface IDefaultErrorOptions
  extends Omit<HttpExceptionOptions, 'message' | 'cause'>,
    IErrorPayload {
  /**
   * This is the list of keys that will be masked in the data object.
   */
  masks?: string[];
  eventName?: string;
  /**
   * This allow to log the error at the same time it is thrown.
   * If set to true, will use the default logger.
   */
  logger?: loggerOptionType;
  /**
   * This allow to emit an event at the same time it is thrown.
   * If set to true, will use the default event emitter.
   * If set to false, will not emit any event.
   * If set to an EventEmitter2 instance, will use that instance.
   */
  eventEmitter?: EventEmitter2 | boolean;
}

export interface IBetterResponseInterface {
  message: string;
  statusCode: number;
  error?: string;
}

/**
 * This is a convenience function to create a new DefaultError class instance that extends the provided base class.
 * @param base
 * @param options
 * @param args
 * @returns
 */
export const newDefaultError = <
  T extends ClassType<HttpException> = typeof HttpException,
>(
  base: T,
  options: IDefaultErrorOptions | string,
  ...args: ConstructorParameters<T>
) => {
  return new (DefaultErrorMixin(base))(options, ...args);
};

export function isDefaultErrorMixin(
  error: any,
): error is IAbstractDefaultError {
  return (error as any).__DefaultErrorMixin !== undefined;
}

export const DefaultErrorMixin = <
  T extends ClassType<HttpException> = typeof HttpException,
>(
  base?: T,
): new (
  options: IDefaultErrorOptions | string,
  ...args: ConstructorParameters<T>
) => IAbstractDefaultError => {
  const BaseClass: ClassType<HttpException> = base ?? HttpException;

  class _AbstractDefaultError
    extends BaseClass
    implements IAbstractDefaultError
  {
    data?: any;
    description?: string;
    internalMessage?: string;
    eventName?: string;
    errorCode?: HttpStatus | number;
    betterResponse: IBetterResponseInterface;

    __DefaultErrorMixin = Object.freeze(true);

    public readonly logger?: Required<loggerOptionType>;
    public readonly eventEmitter?: EventEmitter2;

    constructor(
      options: IDefaultErrorOptions | string,
      ...args: ConstructorParameters<T>
    ) {
      super(...args);

      let _options: IDefaultErrorOptions = {};
      /**
       * If the options is a string, it means that it is the systemMessage.
       */
      if (typeof options === 'string') {
        _options = {
          response: options,
        };
      } else {
        _options = options;
      }

      this.internalMessage = _options.internalMessage;

      const cause = _options.cause;
      const message = this.message;
      const stack =
        isNativeError(cause) && cause?.stack ? cause?.stack : this.stack;
      const eventName = _options.eventName ?? ON_DEFAULT_ERROR_EVENT;

      this.errorCode =
        _options.errorCode ??
        this.getStatus() ??
        HttpStatus.INTERNAL_SERVER_ERROR;

      this.description =
        _options.description ?? getHttpStatusDescription(this.errorCode);

      this.betterResponse = _AbstractDefaultError.buildResponse(
        this.description,
        this.errorCode,
        _options.response,
      );

      this.data = _options.masks
        ? maskDataInObject(_options.data, _options.masks)
        : _options.data;

      const payload: IErrorPayload = {
        response: this.betterResponse,
        cause,
        errorCode: this.errorCode,
        description: this.description,
        // custom error properties
        data: this.data,
        internalMessage: this.internalMessage,
      };

      if (_options.logger) {
        const defaults: Required<loggerOptionType> = {
          instance: AppLoggerFactory('DefaultError'),
          level: 'error',
        };

        this.logger = { ...defaults, ..._options.logger };

        this.logger.instance?.[this.logger.level]?.(message, stack, {
          data: payload,
        });
      }

      const eventEmitter =
        _options.eventEmitter === true || _options.eventEmitter === undefined
          ? getGlobalEventEmitter()
          : _options.eventEmitter;

      if (eventName && eventEmitter !== false) {
        this.eventName = eventName;
        this.eventEmitter = eventEmitter;
        this.eventEmitter.emit(eventName, {
          ...payload,
          eventName,
        });
      }
    }

    getInternalMessage(): string | undefined {
      return this.internalMessage;
    }

    getDescription(): string | undefined {
      return this.description;
    }

    getResponse(): IBetterResponseInterface {
      return this.betterResponse;
    }

    static buildResponse(
      description: string,
      statusCode: number,
      response?: string | Record<string, any>,
    ): IBetterResponseInterface {
      let message: string = description;
      let responseObj: Record<string, any> = {};
      if (typeof response === 'string' || response instanceof String) {
        message = response as string;
      } else {
        responseObj = response ? (response as Record<string, any>) : {};
      }

      /**
       * We know that passing a string as the first argument
       * it returns an object with the message, error and the statusCode.
       */
      const baseBody = HttpException.createBody(
        message,
        getHttpStatusNameByCode(statusCode),
        statusCode,
      ) as { message: string; statusCode: number; error?: string };

      return {
        ...baseBody,
        message,
        ...responseObj,
      };
    }
  }

  return _AbstractDefaultError;
};

export type DefaultErrorMixin = Mixin<typeof DefaultErrorMixin>;

export function DefaultErrorBase(base?: ClassType<HttpException>) {
  return class extends DefaultErrorMixin(base ?? HttpException) {
    constructor(
      internalMessage?: string,
      /**
       * These are the DefaultError extended options.
       */
      options?: Omit<IDefaultErrorOptions, 'internalMessage'>,
    ) {
      super(
        { ...(options ?? {}), internalMessage },
        options?.response ?? ErrorsEnum.INTERNAL_SERVER_ERROR,
        options?.errorCode,
        options,
      );
    }
  };
}

export class DefaultError extends DefaultErrorBase() {}
