import { getGlobalEventEmitter } from '@nestjs-yalc/event-manager';
import { type ImprovedLoggerService } from '@nestjs-yalc/logger/logger-abstract.service.js';
import { maskDataInObject } from '@nestjs-yalc/logger/logger.helper.js';
import { ClassType, Mixin } from '@nestjs-yalc/types/globals.d.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

export const ON_DEFAULT_ERROR_EVENT = 'onDefaultError';

export interface IAbstractDefaultError extends Error {
  data?: any;
  systemMessage?: string;
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
        let logger: ImprovedLoggerService | Console;
        if (options.logger === true) {
          logger = console;
        } else {
          logger = options.logger;
        }

        logger.error(this.systemMessage ?? message, this.stack, {
          data: {
            ...this.data,
            // This is the original message that was thrown.
            _originalMessage: message,
          },
        });
      }

      const eventEmitter = options?.eventEmitter ?? getGlobalEventEmitter();

      if (options?.eventName !== false) {
        eventEmitter.emit(options?.eventName ?? ON_DEFAULT_ERROR_EVENT, {
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

export class DefaultError extends DefaultErrorMixin<typeof Error>(Error) {
  constructor(
    message?: string,
    /**
     * These are the DefaultError extended options.
     */
    options?: IDefaultErrorOptions,
    /**
     * This is used to pass options to the base error class.
     */
    baseOptions?: ErrorOptions,
  ) {
    super(options ?? {}, message ?? 'An error occurred', baseOptions);
  }
}
