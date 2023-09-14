import { LogLevel, Logger } from '@nestjs/common';
import { type ImprovedLoggerService } from '@nestjs-yalc/logger/logger-abstract.service.js';
import { LogLevelEnum } from '@nestjs-yalc/logger/logger.enum.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { maskDataInObject } from '@nestjs-yalc/logger/logger.helper.js';
import { DefaultError } from '@nestjs-yalc/errors/default.error.js';
import { EventNameFormatter, emitEvent, formatName } from './emitter.js';
import { ClassType } from '@nestjs-yalc/types/globals.d.js';
import { getGlobalEventEmitter } from './global-emitter.js';

interface IEventEmitterOptions<
  TFormatter extends EventNameFormatter = EventNameFormatter,
> {
  emitter?: EventEmitter2;
  formatter?: TFormatter;
  await?: boolean;
}

export interface IEventOptions<
  TFormatter extends EventNameFormatter = EventNameFormatter,
> {
  data?: any;
  mask?: string[];
  trace?: string;
  event?: IEventEmitterOptions<TFormatter> | false;
  message?: string;
  logger?: { instance?: ImprovedLoggerService; level?: LogLevel } | false;
  error?:
    | {
        class?: ClassType<DefaultError> | ClassType<Error>;
        systemMessage?: string;
        baseOptions?: ErrorOptions;
      }
    | boolean;
}

export function applyAwaitOption<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(options?: IEventOptions<TFormatter>): IEventOptions<TFormatter> {
  let event = options?.event;
  if (event !== false && event !== undefined) {
    event = { ...event, await: event.await ?? true };
  }
  return { ...options, event };
}

type ReturnType<T> = T extends { error: false }
  ? boolean | any[] | undefined
  : Error | DefaultError | undefined;

export function event<
  TFormatter extends EventNameFormatter = EventNameFormatter,
  TOption extends IEventOptions<TFormatter> = IEventOptions<TFormatter>,
>(
  eventName: Parameters<TFormatter> | string,
  options?: TOption,
): Promise<ReturnType<TOption>> | ReturnType<TOption> {
  const {
    data: receivedData,
    error,
    event,
    logger,
    mask,
    trace,
  } = options ?? {};

  const formattedEventName = formatName(
    eventName,
    options?.event ? options?.event?.formatter : undefined,
  );

  let data = { ...receivedData, eventName: formattedEventName };
  if (mask) data = maskDataInObject(data, mask);

  const optionalMessage = options?.logger ? options.message : undefined;

  /**
   *
   * LOGGER
   *
   * We build the logger function here unless the logger is false
   */
  if (logger !== false) {
    const message = optionalMessage ?? formattedEventName;

    const loggerInstance = logger?.instance ?? Logger;
    const loggerLevel = logger?.level ?? 'log';

    if (loggerLevel === 'error') {
      loggerInstance.error(message, trace, {
        data,
        event: false,
      });
    } else {
      loggerInstance[loggerLevel]?.(message, {
        data,
        event: false,
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

    result = emitEvent<TFormatter>(
      eventEmitter,
      eventName,
      { message: optionalMessage, data },
      {
        formatter,
        await: event?.await,
      },
    );
  }

  /**
   *
   * ERROR
   *
   */
  if (error !== false && error !== undefined) {
    let errorClass, systemMessage, baseOptions;
    if (error === true) {
      errorClass = DefaultError;
    } else {
      errorClass = error.class ?? DefaultError;
      systemMessage = error.systemMessage;
      baseOptions = error.baseOptions;
    }

    /**
     * We build the message here.
     */
    const message = optionalMessage ?? formattedEventName;

    return new errorClass(
      message,
      {
        data,
        systemMessage,
        eventName: false,
      },
      baseOptions,
    ) as ReturnType<TOption>;
  }

  return result as Promise<ReturnType<TOption>>;
}

function getLoggerOption(options?: IEventOptions) {
  return options?.logger ?? {};
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
    logger: {
      ...getLoggerOption(_options),
      level: LogLevelEnum.LOG,
    },
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
    logger: {
      ...getLoggerOption(options),
      level: LogLevelEnum.LOG,
    },
  });
}

export async function eventErrorAsync<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  eventName: Parameters<TFormatter> | string,
  options?: Omit<IEventOptions<TFormatter>, 'error'>,
): Promise<any> {
  const _options = applyAwaitOption<TFormatter>(options);
  return eventError(eventName, _options);
}

export function eventError<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  eventName: Parameters<TFormatter> | string,
  options?: IEventOptions<TFormatter>,
): any {
  return event(eventName, {
    ...options,
    logger: {
      ...getLoggerOption(options),
      level: LogLevelEnum.ERROR,
    },
    error: options?.error !== false && {
      class:
        typeof options?.error === 'object' && options.error.class
          ? options.error.class
          : DefaultError,
    },
  });
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
    logger: {
      ...getLoggerOption(_options),
      level: LogLevelEnum.WARN,
    },
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
    logger: {
      ...getLoggerOption(options),
      level: LogLevelEnum.WARN,
    },
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
    logger: {
      ...getLoggerOption(_options),
      level: LogLevelEnum.DEBUG,
    },
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
    logger: {
      ...getLoggerOption(options),
      level: LogLevelEnum.DEBUG,
    },
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
    logger: {
      ...getLoggerOption(_options),
      level: LogLevelEnum.VERBOSE,
    },
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
    logger: {
      ...getLoggerOption(options),
      level: LogLevelEnum.VERBOSE,
    },
  });
}