import { getGlobalEventEmitter } from '@nestjs-yalc/event-manager/global-emitter.js';
import type { ImprovedLoggerService } from '@nestjs-yalc/logger/logger-abstract.service.js';
import { maskDataInObject } from '@nestjs-yalc/logger/logger.helper.js';
import { ClassType, Mixin } from '@nestjs-yalc/types/globals.d.js';
import {
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export const ON_DEFAULT_ERROR_EVENT = 'onDefaultError';

export interface IAbstractDefaultError extends Error {
  data?: any;
  systemMessage?: string;
  logger?: ImprovedLoggerService | Console;
  eventEmitter?: EventEmitter2;
}

export interface IDefaultErrorOptions {
  data?: any;
  masks?: string[];
  /**
   * This allow to log the error at the same time it is thrown.
   * If set to true, will use the default logger.
   */
  logger?: ImprovedLoggerService | boolean;
  /**
   * This is the message that will be logged in the system but won't be thrown to the user.
   */
  systemMessage?: string;
  eventEmitter?: EventEmitter2;
  eventName?: string | false;
  statusCode?: HttpStatus | number;
}

/**
 * This is a convenience function to create a new DefaultError class instance that extends the provided base class.
 * @param base
 * @param options
 * @param args
 * @returns
 */
export const newDefaultError = <T extends ClassType<Error> = typeof Error>(
  base: T,
  options: IDefaultErrorOptions | string,
  ...args: ConstructorParameters<T>
) => {
  return new (DefaultErrorMixin(base))(options, ...args);
};

export function isDefaultErrorMixin(
  error: Error,
): error is IAbstractDefaultError {
  return (error as any).__DefaultErrorMixin !== undefined;
}

export const DefaultErrorMixin = <T extends ClassType<Error> = typeof Error>(
  base?: T,
): new (
  options: IDefaultErrorOptions | string,
  ...args: ConstructorParameters<T>
) => IAbstractDefaultError => {
  const baseClass: ClassType<Error> = base ?? Error;

  class _AbstractDefaultError
    extends baseClass
    implements IAbstractDefaultError
  {
    data?: any;
    systemMessage?: string;

    __DefaultErrorMixin = Object.freeze(true);

    public readonly logger?: ImprovedLoggerService | Console;
    public readonly eventEmitter?: EventEmitter2;

    constructor(
      options: IDefaultErrorOptions | string,
      ...args: ConstructorParameters<T>
    ) {
      super(...args);

      const message = args[0] as string;

      /**
       * If the options is a string, it means that it is the systemMessage.
       */
      if (typeof options === 'string') {
        options = {
          systemMessage: options,
        };
      }

      this.data = options?.masks
        ? maskDataInObject(options.data, options?.masks)
        : options?.data;

      if (options?.systemMessage) this.systemMessage = options?.systemMessage;

      if (options?.logger) {
        if (options.logger === true) {
          this.logger = console;
        } else {
          this.logger = options.logger;
        }

        this.logger.error(this.systemMessage ?? message, this.stack, {
          data: {
            ...this.data,
            // This is the original message that was thrown.
            _originalMessage: message,
          },
        });
      }

      this.eventEmitter = options?.eventEmitter ?? getGlobalEventEmitter();

      if (options?.eventName !== false) {
        this.eventEmitter.emit(options?.eventName ?? ON_DEFAULT_ERROR_EVENT, {
          data: this.data,
          systemMessage: this.systemMessage,
          message,
        });
      }
    }
  }

  return _AbstractDefaultError;
};

export type DefaultErrorMixin = Mixin<typeof DefaultErrorMixin>;

export class DefaultError extends DefaultErrorMixin<typeof HttpException>(
  HttpException,
) {
  constructor(
    message?: string,
    /**
     * These are the DefaultError extended options.
     */
    options?: IDefaultErrorOptions,
    /**
     * This is used to pass options to the base error class.
     */
    baseOptions?: HttpExceptionOptions,
  ) {
    super(
      options ?? {},
      message ?? 'An error occurred',
      options?.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR,
      baseOptions,
    );
  }
}
