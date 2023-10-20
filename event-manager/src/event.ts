import { LogLevel } from '@nestjs/common';
import { type ImprovedLoggerService } from '@nestjs-yalc/logger/logger-abstract.service.js';
import { LogLevelEnum } from '@nestjs-yalc/logger/logger.enum.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { maskDataInObject } from '@nestjs-yalc/logger/logger.helper.js';
import {
  DefaultError,
  ILogErrorPayload,
  IErrorPayload,
  isDefaultErrorMixin,
} from '@nestjs-yalc/errors/default.error.js';
import { EventNameFormatter, emitEvent, formatName } from './emitter.js';
import { ClassType, InstanceType } from '@nestjs-yalc/types/globals.d.js';
import { getGlobalEventEmitter } from './global-emitter.js';
import { AppLoggerFactory } from '@nestjs-yalc/logger/logger.factory.js';

interface IEventEmitterOptions<
  TFormatter extends EventNameFormatter = EventNameFormatter,
> {
  emitter?: EventEmitter2;
  formatter?: TFormatter;
  await?: boolean;
}

export interface IDataInfo {
  [key: string]: any;
  /**
   * We know that eventName is always added to the data object
   */
  eventName: string;
}

export interface IEventPayload {
  message?: string;
  data?: IDataInfo;
  eventName: string;
  errorInfo?: IErrorPayload;
}

export interface IEventOptions<
  TFormatter extends EventNameFormatter = EventNameFormatter,
> {
  data?: any;
  mask?: string[];
  event?: IEventEmitterOptions<TFormatter> | false;
  message?: string;
  trace?: string;
  logger?: { instance?: ImprovedLoggerService; level?: LogLevel } | false;
}

export interface IErrorEventOptions<
  TFormatter extends EventNameFormatter = EventNameFormatter,
  TErrorClass extends DefaultError = DefaultError,
> extends IEventOptions<TFormatter>,
    Omit<IErrorPayload, 'internalMessage' | 'data'> {
  errorClass?: ClassType<TErrorClass> | boolean;
}

export interface IErrorEventOptionsRequired<
  TFormatter extends EventNameFormatter = EventNameFormatter,
  TErrorClass extends DefaultError = DefaultError,
> extends Omit<IErrorEventOptions<TFormatter, TErrorClass>, 'errorClass'>,
    Required<Pick<IErrorEventOptions<TFormatter, TErrorClass>, 'errorClass'>> {}

export function applyAwaitOption<
  TFormatter extends EventNameFormatter = EventNameFormatter,
  TOpts extends
    | IErrorEventOptions<TFormatter>
    | IEventOptions<TFormatter> = IEventOptions<TFormatter>,
>(options?: TOpts): TOpts {
  let event = options?.event;
  if (event !== false && event !== undefined) {
    event = { ...event, await: event.await ?? true };
  }
  return { ...options, event } as TOpts;
}

type ReturnType<T> = T extends { errorClass: false }
  ? boolean | any[] | undefined
  : Error | DefaultError;

type PickError<
  TFormatter extends EventNameFormatter = EventNameFormatter,
  TOpt extends IErrorEventOptions<TFormatter> = IErrorEventOptions<TFormatter>,
> = NonNullable<
  TOpt extends { errorClass: infer T }
    ? T extends boolean
      ? DefaultError
      : InstanceType<T>
    : never
>;

type eventErrorReturnType<
  TFormatter extends EventNameFormatter = EventNameFormatter,
  TOpt extends IErrorEventOptions<TFormatter> = IErrorEventOptions<TFormatter>,
> = TOpt extends {
  errorClass: false;
}
  ? TOpt extends { await: true }
    ? Promise<boolean | any[] | undefined>
    : boolean | any[] | undefined
  : TOpt extends { await: true }
  ? Promise<PickError<TFormatter, TOpt>>
  : PickError<TFormatter, TOpt>;

type eventErrorReturnTypeAsync<
  TFormatter extends EventNameFormatter = EventNameFormatter,
  TOpt extends IErrorEventOptions<TFormatter> = IErrorEventOptions<TFormatter>,
> = Promise<
  TOpt extends {
    errorClass: false;
  }
    ? boolean | any | undefined
    : PickError<TFormatter, TOpt>
>;

export const isErrorOptions = (
  options?: IEventOptions | IErrorEventOptions,
): options is IErrorEventOptions => {
  return (options as IErrorEventOptions)?.errorClass !== undefined;
};

export function event<
  TFormatter extends EventNameFormatter = EventNameFormatter,
  TOption extends
    | IEventOptions<TFormatter>
    | IErrorEventOptions<TFormatter> = IEventOptions<TFormatter>,
>(
  eventName: Parameters<TFormatter> | string,
  options?: TOption,
): Promise<ReturnType<TOption>> | ReturnType<TOption> {
  let { data: receivedData, event, logger, mask, trace } = options ?? {};

  const formattedEventName = formatName(
    eventName,
    options?.event ? options?.event?.formatter : undefined,
  );

  if (typeof receivedData === 'string') {
    receivedData = { message: receivedData };
  }

  if (mask) receivedData = maskDataInObject(receivedData, mask);
  let data: IDataInfo = { ...receivedData, eventName: formattedEventName };

  const optionalMessage = options?.logger ? options.message : undefined;

  /**
   *
   * ERROR
   *
   */
  let errorInstance;
  let errorPayload: ILogErrorPayload = {};
  if (isErrorOptions(options)) {
    const error = options?.errorClass ?? true;

    if (error !== false && error !== undefined) {
      let errorClass;
      let errorOptions = {};
      if (error === true) {
        errorClass = DefaultError;
      } else {
        const { errorClass: _class, ...rest } = options;
        errorOptions = rest;
        errorClass = error ?? DefaultError;
      }

      /**
       * We build the message here.
       */
      const message = optionalMessage ?? formattedEventName;

      errorInstance = new errorClass(message, {
        data: receivedData,
        eventName: formattedEventName,
        ...errorOptions,
        eventEmitter: false,
        logger: false,
      }) as ReturnType<TOption>;

      if (isDefaultErrorMixin(errorInstance)) {
        errorPayload = errorInstance.getEventPayload();
      } else {
        errorPayload = {
          ...(errorInstance as any),
          data: receivedData,
        };
      }
    }
  }

  /**
   *
   * LOGGER
   *
   * We build the logger function here unless the logger is false
   */
  if (logger !== false) {
    const { instance: _instance, level: _level, ...rest } = logger ?? {};

    const { level, instance } = {
      instance: _instance ?? AppLoggerFactory('Event'),
      level: _level ?? 'log',
      ...rest,
    };

    const message = optionalMessage ?? formattedEventName;

    if (level === 'error') {
      instance.error(message, trace ?? errorPayload?.trace, {
        data: { data, ...errorPayload },
        event: false,
        trace: trace ?? errorPayload?.trace,
      });
    } else {
      instance[level]?.(message, {
        data: { data, ...errorPayload },
        event: false,
        trace: trace ?? errorPayload?.trace,
      });
    }
  }

  /**
   *
   * EVENT
   *
   * We emit the event here unless the event is false
   */
  let result;
  if (event !== false) {
    let eventEmitter = event?.emitter ?? getGlobalEventEmitter();
    let formatter = event?.formatter;

    const eventPayload: IEventPayload = {
      message: optionalMessage,
      data,
      eventName: formattedEventName,
      errorInfo:
        Object.keys(errorPayload).length > 0 ? errorPayload : undefined,
    };

    result = emitEvent<TFormatter>(eventEmitter, eventName, eventPayload, {
      formatter,
      await: event?.await,
    });
  }

  return errorInstance ?? (result as Promise<ReturnType<TOption>>);
}

function getLoggerOption(level: LogLevel, options?: IEventOptions) {
  if (options?.logger === false) return false;

  return { level, ...options?.logger };
}

export async function eventLogAsync<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  eventName: Parameters<TFormatter> | string,
  options?: IEventOptions<TFormatter>,
): Promise<any> {
  const _options = applyAwaitOption<TFormatter>(options);
  return event(eventName, {
    ..._options,
    logger: getLoggerOption(LogLevelEnum.LOG, _options),
  });
}

export function eventLog<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  eventName: Parameters<TFormatter> | string,
  options?: IEventOptions<TFormatter>,
): any {
  return event(eventName, {
    ...options,
    logger: getLoggerOption(LogLevelEnum.LOG, options),
  });
}

export async function eventErrorAsync<
  TFormatter extends EventNameFormatter = EventNameFormatter,
  TOption extends IErrorEventOptions<TFormatter> = IEventOptions<TFormatter>,
>(
  eventName: Parameters<TFormatter> | string,
  options?: TOption,
): eventErrorReturnTypeAsync<TFormatter, TOption> {
  const _options = applyAwaitOption<TFormatter, TOption>(options);
  return eventError<TFormatter, TOption>(
    eventName,
    _options,
  ) as unknown as eventErrorReturnTypeAsync<TFormatter, TOption>;
}

export function eventError<
  TFormatter extends EventNameFormatter = EventNameFormatter,
  TOption extends IErrorEventOptions<TFormatter> = IErrorEventOptions<TFormatter>,
>(
  eventName: Parameters<TFormatter> | string,
  options?: TOption,
): eventErrorReturnType<TFormatter, TOption> {
  const _options: IErrorEventOptionsRequired<TFormatter> = {
    ...(options ?? {}),
    logger: getLoggerOption(LogLevelEnum.ERROR, options),
    errorClass: options?.errorClass ?? true,
  };
  return event<TFormatter>(
    eventName,
    _options,
  ) as unknown as eventErrorReturnType<TFormatter, TOption>;
}

export async function eventWarnAsync<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  eventName: Parameters<TFormatter> | string,
  options?: IEventOptions<TFormatter>,
): Promise<any> {
  const _options = applyAwaitOption<TFormatter>(options);
  return event(eventName, {
    ..._options,
    logger: getLoggerOption(LogLevelEnum.WARN, _options),
  });
}

export function eventWarn<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  eventName: Parameters<TFormatter> | string,
  options?: IEventOptions<TFormatter>,
): any {
  return event(eventName, {
    ...options,
    logger: getLoggerOption(LogLevelEnum.WARN, options),
  });
}

export async function eventDebugAsync<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  eventName: Parameters<TFormatter> | string,
  options?: IEventOptions<TFormatter>,
): Promise<any> {
  const _options = applyAwaitOption<TFormatter>(options);
  return event(eventName, {
    ..._options,
    logger: getLoggerOption(LogLevelEnum.DEBUG, _options),
  });
}

export function eventDebug<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  eventName: Parameters<TFormatter> | string,
  options?: IEventOptions<TFormatter>,
): any {
  return event(eventName, {
    ...options,
    logger: getLoggerOption(LogLevelEnum.DEBUG, options),
  });
}

export async function eventVerboseAsync<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  eventName: Parameters<TFormatter> | string,
  options?: IEventOptions<TFormatter>,
): Promise<any> {
  const _options = applyAwaitOption<TFormatter>(options);
  return event(eventName, {
    ..._options,
    logger: getLoggerOption(LogLevelEnum.VERBOSE, _options),
  });
}

export function eventVerbose<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  eventName: Parameters<TFormatter> | string,
  options?: IEventOptions<TFormatter>,
): any {
  return event(eventName, {
    ...options,
    logger: getLoggerOption(LogLevelEnum.VERBOSE, options),
  });
}
