import { getLogLevelByStatus } from '@nestjs-yalc/event-manager/event.helper.js';
import { getYalcGlobalEventEmitter } from '@nestjs-yalc/event-manager/global-emitter.js';
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
import { getHttpStatusNameByCode } from './error.enum.js';

export const ON_DEFAULT_ERROR_EVENT = 'onDefaultError';

export interface ISharedErrorProperties {
  /**
   * The data that will be used internally. It can contain sensitive data.
   */
  data?: any;

  /**
   * The message that will be used internally. It can contain sensitive data.
   */
  internalMessage?: string;

  /**
   * Human readable description of the error code
   */
  description?: string;

  /**
   * When the event is specified, it includes the event name
   */
  eventName?: string;
}

export interface IHttpExceptionArguments {
  /**
   * The response that can be sent to the client. It can be a string or an object (including an error object)
   * It must not contain sensitive data.
   */
  response?: Partial<IBetterResponseInterface>;
  /**
   * Http status code or a custom error code
   */
  errorCode?: HttpStatus | number;
}

/**
 * The arguments used by the NestJS classes that extend the HttpException class.
 */
export interface IHttpExceptionParentArguments
  extends Omit<IHttpExceptionArguments, 'errorCode'> {}

export interface IErrorPayload
  extends ISharedErrorProperties,
    IHttpExceptionArguments {
  /**
   * The original cause of the error.
   */
  cause?: IFormattedCause | unknown;

  /**
   * When the error is specified, it includes the error name
   */
  errorName?: string;
}

export interface IErrorEventPayload extends IErrorPayload {
  /**
   * This is the message used for the response object. It can be sent to the client
   */
  message?: string;

  trace?: string;
}

export interface ILogErrorPayload
  extends Omit<IErrorEventPayload, keyof IHttpExceptionArguments> {
  [key: string]: any;
}

type loggerOptionType =
  | { instance?: ImprovedLoggerService; level?: LogLevel }
  | false;

export interface IAbstractDefaultError
  extends Omit<HttpException, 'cause' | 'message'>,
    Omit<IErrorEventPayload, 'response'> {
  logger?: loggerOptionType;
  eventEmitter?: EventEmitter2;
  getResponse(): IBetterResponseInterface;
  getInternalMessage(): string | undefined;
  getDescription(): string | undefined;
  /**
   * Contains most of the error info that can be used for logging
   * or for event payloads
   */
  getEventPayload(): IErrorEventPayload;
}

export interface IAbstractDefaultErrorConstructor<
  TErrorClass extends ClassType<HttpException> = ClassType<HttpException>,
> {
  new (
    options: IAbstractDefaultErrorOptions,
    ...args: ConstructorParameters<TErrorClass>
  ): IAbstractDefaultError;
}

export interface IAbstractDefaultErrorOptions extends ISharedErrorProperties {
  /**
   * This is the list of keys that will be masked in the data object.
   */
  masks?: string[];
  eventName?: string;
  /**
   * This allow to log the error at the same time it is thrown.
   * If set to true, will use the default logger.
   */
  logger?: loggerOptionType | boolean;
  /**
   * This allow to emit an event at the same time it is thrown.
   * If set to true, will use the default event emitter.
   * If set to false, will not emit any event.
   * If set to an EventEmitter2 instance, will use that instance.
   */
  eventEmitter?: EventEmitter2 | boolean;
}

export interface IDefaultErrorBaseOptions
  extends Omit<IAbstractDefaultErrorOptions, 'internalMessage'>,
    HttpExceptionOptions,
    IHttpExceptionParentArguments {}

export interface IDefaultErrorOptions
  extends Omit<IAbstractDefaultErrorOptions, 'internalMessage'>,
    HttpExceptionOptions,
    IHttpExceptionArguments {}

export interface IBetterResponseInterface {
  /**
   * This is the error name (ex: 'Bad Request' or custom error name)
   */
  error?: string;
  /**
   * This is the error code (ex: 400 or custom error code)
   */
  statusCode: number;
  /**
   * Human readable description of the status code. Can be automatically generated from the statusCode or set manually.
   */
  statusCodeDescription: string;
  /**
   * The message can be set manually or automatically generated from the error name.
   * It should describe what happened.
   * Note: the same statusCode can be used for different errors,
   * so the message should be different while the description should remain the same for each statusCode.
   */
  message: string;
  /**
   * Other properties that can be added dynamically to the response object.
   */
  [key: string]: any;
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
  options: IAbstractDefaultErrorOptions,
  ...args: ConstructorParameters<T>
) => {
  return new (DefaultErrorMixin(base))(options, ...args);
};

export function isDefaultErrorMixin(
  error: any,
): error is IAbstractDefaultError {
  return (error as any).__DefaultErrorMixin !== undefined;
}

interface IFormattedCause {
  message?: string;
  stack?: string;
  parentCause?: IFormattedCause;
  [key: string]: any;
}

export function formatCause(
  error?: Error | unknown,
): IFormattedCause | undefined {
  if (!error) {
    return undefined;
  }

  const { message, stack, cause, ...rest } = error as Error;

  return {
    message,
    trace: stack,
    parentCause: cause ? formatCause(cause) : undefined,
    ...rest,
  };
}

export const DefaultErrorMixin = <
  T extends ClassType<HttpException> = ClassType<HttpException>,
>(
  base?: T,
): IAbstractDefaultErrorConstructor<T> => {
  const BaseClass: ClassType<HttpException> = base ?? HttpException;

  class _AbstractDefaultError
    extends BaseClass
    implements IAbstractDefaultError
  {
    data?: any;
    description?: string;
    internalMessage?: string;
    eventName?: string;

    __DefaultErrorMixin = Object.freeze(true);

    protected eventPayload: IErrorEventPayload;
    protected betterResponse: IBetterResponseInterface;
    public readonly logger?: Required<loggerOptionType>;
    public readonly eventEmitter?: EventEmitter2;

    constructor(
      options: IAbstractDefaultErrorOptions,
      ...args: ConstructorParameters<T>
    ) {
      super(...args);

      const message = this.message;
      const stack = this.stack;
      const errorCode = this.getStatus();

      const causeMessage = `${(this.cause as Error)?.message ?? this.cause}`;
      

      this.internalMessage = options.internalMessage ?? causeMessage;
      this.eventName = options.eventName;

      this.description =
        options.description ?? getHttpStatusDescription(errorCode);

      this.betterResponse = _AbstractDefaultError.buildResponse(
        message,
        this.description,
        errorCode,
        super.getResponse(),
      );

      this.data = options.masks
        ? maskDataInObject(options.data, options.masks)
        : options.data;

      const formattedCause = formatCause(this.cause);

      const payload: ILogErrorPayload = {
        data: this.data,
        eventName: this.eventName,
        description: this.description,
        internalMessage: this.internalMessage,
        errorName: this.name,
        ...this.betterResponse,
        trace: stack,
        cause: formattedCause,
      };

      this.eventPayload = payload;

      if (options.logger) {
        const { instance, level } =
          options.logger !== true
            ? options.logger
            : { instance: undefined, level: undefined };

        this.logger = {
          instance: instance ?? AppLoggerFactory('DefaultError'),
          level: level ?? getLogLevelByStatus(this.getStatus()),
        };

        if (this.logger.level === 'error') {
          this.logger.instance.error(message, stack, {
            data: payload,
            trace: stack,
          });
        } else {
          this.logger.instance?.[this.logger.level]?.(message, {
            data: payload,
            trace: stack,
          });
        }
      }

      const eventEmitter =
        options.eventEmitter === true || options.eventEmitter === undefined
          ? getYalcGlobalEventEmitter()
          : options.eventEmitter;

      if (eventEmitter !== false) {
        this.eventName ??= ON_DEFAULT_ERROR_EVENT;
        this.eventEmitter = eventEmitter;
        this.eventEmitter.emit(this.eventName, {
          ...payload,
          eventName: this.eventName,
        });
      }
    }

    getEventPayload(): IErrorEventPayload {
      return this.eventPayload;
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
      message: string,
      codeDescription: string,
      statusCode: number,
      response: string | Record<string, any>,
    ): IBetterResponseInterface {
      let responseObj: Record<string, any> = {};
      if (typeof response === 'string' || response instanceof String) {
        message = response as string;
      } else {
        responseObj = response;
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
        statusCodeDescription: codeDescription,
        ...baseBody,
        message,
        ...responseObj,
      };
    }
  }

  return _AbstractDefaultError;
};

export type DefaultErrorMixin = Mixin<typeof DefaultErrorMixin>;

export interface IDefaultErrorBaseConstructor<
  T extends ClassType<HttpException> = ClassType<HttpException>,
> {
  new (
    internalMessage?: string,
    /**
     * These are the DefaultError extended options.
     */
    options?: Omit<IAbstractDefaultErrorOptions, 'internalMessage'>,
    ...args: ConstructorParameters<T>
  ): IAbstractDefaultError;
}

/**
 *
 * Can be used to create new HttpException classes that extend the DefaultError class.
 *
 */
export function DefaultErrorBase<
  T extends ClassType<HttpException> = ClassType<HttpException>,
>(base?: T): IDefaultErrorBaseConstructor<T> {
  return class extends DefaultErrorMixin(base ?? HttpException) {
    constructor(
      internalMessage?: string,
      /**
       * These are the DefaultError extended options.
       */
      options?: Omit<IAbstractDefaultErrorOptions, 'internalMessage'>,
      ...args: ConstructorParameters<T>
    ) {
      super({ ...(options ?? {}), internalMessage }, ...args);
    }
  };
}

/**
 * Default error that can be triggered without the base class
 * It extends the HttpException class and the IAbstractDefaultError interface.
 */
export class DefaultError extends DefaultErrorBase(HttpException) {
  constructor(
    internalMessage?: string,
    /**
     * These are the DefaultError extended options.
     */
    options?: IDefaultErrorOptions,
  ) {
    const { description, cause, response, errorCode, ...defaultOptions } =
      options ?? {};
    super(
      internalMessage,
      { ...defaultOptions, description },
      response ?? {},
      errorCode ?? HttpStatus.INTERNAL_SERVER_ERROR,
      {
        description,
        cause,
      },
    );
  }
}
