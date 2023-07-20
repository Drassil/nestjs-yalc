import { LogLevel } from '@nestjs/common';
import { ImprovedLoggerService } from '@nestjs-yalc/logger/logger-abstract.service.js';
import { ConsoleLogger } from '@nestjs-yalc/logger/logger-console.service.js';
import {
  LOG_LEVEL_ALL,
  LogLevelEnum,
} from '@nestjs-yalc/logger/logger.enum.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { maskDataInObject } from '@nestjs-yalc/logger/logger.helper.js';
import { DefaultError } from '@nestjs-yalc/errors/default.error.js';
import { EventNameFormatter, emitEvent } from './emitter.js';
import { ClassType } from '@nestjs-yalc/types/globals.d.js';

let eventEmitter: EventEmitter2;

export function getEventEmitter() {
  if (!eventEmitter)
    eventEmitter = new EventEmitter2({
      maxListeners: 1000,
    });
  return eventEmitter;
}

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
  event?:
    | (IEventEmitterOptions<TFormatter> & {
        name: Parameters<TFormatter> | string;
      })
    | false;
  logger?: { instance?: ImprovedLoggerService; level?: LogLevel } | false;
  error?:
    | {
        class?: ClassType<DefaultError> | ClassType<Error>;
        systemMessage?: string;
        baseOptions?: ErrorOptions;
      }
    | boolean;
}

export interface IEventWithoutEventNameOptions<
  TFormatter extends EventNameFormatter = EventNameFormatter,
> extends Omit<IEventOptions<TFormatter>, 'event'> {
  event?: IEventEmitterOptions<TFormatter> | false;
}

function isEventOptionWithName<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  event?: IEventEmitterOptions<TFormatter> | string,
): event is IEventEmitterOptions<TFormatter> & {
  name: Parameters<TFormatter> | string;
} {
  return event !== undefined && typeof event !== 'string' && 'name' in event;
}

function buildOptions<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  eventNameOrOptions: string | IEventOptions<TFormatter>,
  options?: IEventWithoutEventNameOptions<TFormatter>,
) {
  let _options;
  if (typeof eventNameOrOptions === 'string') {
    _options = {
      ...options,
      event: { ...(options?.event ?? {}), name: eventNameOrOptions },
    };
  } else {
    _options = eventNameOrOptions;
  }

  return _options;
}

type ReturnType<T> = T extends { error: false }
  ? boolean | any[] | undefined
  : Error | DefaultError | undefined;

function event<
  TFormatter extends EventNameFormatter = EventNameFormatter,
  TOption extends IEventWithoutEventNameOptions<TFormatter> = IEventWithoutEventNameOptions<TFormatter>,
>(
  message: string,
  eventName: string,
  options: TOption,
): Promise<ReturnType<TOption>> | ReturnType<TOption>;

function event<
  TFormatter extends EventNameFormatter = EventNameFormatter,
  TOption extends IEventOptions<TFormatter> = IEventOptions<TFormatter>,
>(
  message: string,
  options: TOption,
): Promise<ReturnType<TOption>> | ReturnType<TOption>;

function event<
  TFormatter extends EventNameFormatter = EventNameFormatter,
  TOption extends IEventWithoutEventNameOptions<TFormatter> = IEventWithoutEventNameOptions<TFormatter>,
>(
  message: string,
  eventNameOrOptions: string | IEventOptions<TFormatter>,
  options?: TOption,
): Promise<ReturnType<TOption>> | ReturnType<TOption> {
  const _options = buildOptions(eventNameOrOptions, options);

  const { data, error, event, logger, mask, trace } = _options;

  let dataPayload = data;
  if (mask) dataPayload = maskDataInObject(data, mask);

  /**
   *
   * LOGGER
   *
   * We build the logger function here unless the logger is false
   */
  if (logger !== false) {
    const loggerInstance =
      logger?.instance ?? new ConsoleLogger('event', LOG_LEVEL_ALL);
    const loggerLevel = logger?.level ?? 'log';

    if (loggerLevel === 'error') {
      loggerInstance.error(message, trace, { masks: mask });
    } else {
      loggerInstance[loggerLevel]?.(message, {
        data: dataPayload,
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
  if (event !== false && event !== undefined) {
    let eventEmitter;
    let name;
    let formatter;
    if (!isEventOptionWithName(event)) {
      eventEmitter = getEventEmitter();
      name = event;
    } else {
      eventEmitter = event?.emitter ?? getEventEmitter();
      name = event?.name;
      formatter = event?.formatter;
    }

    result = emitEvent<TFormatter>(eventEmitter, name, dataPayload, {
      formatter,
      mask,
      await: event?.await,
    });
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

    return new errorClass(
      message,
      {
        data: dataPayload,
        systemMessage,
      },
      baseOptions,
    ) as ReturnType<TOption>;
  }

  return result as Promise<ReturnType<TOption>>;
}

export async function eventLog<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  message: string,
  eventName: string,
  options: IEventWithoutEventNameOptions<TFormatter>,
): Promise<any>;

export async function eventLog<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(message: string, options: IEventOptions<TFormatter>): Promise<any>;

export async function eventLog<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  message: string,
  eventNameOrOptions: string | IEventOptions<TFormatter>,
  options?: IEventWithoutEventNameOptions<TFormatter>,
): Promise<any> {
  const _options = buildOptions(eventNameOrOptions, options);
  return event(message, {
    ..._options,
    logger: { ...(_options.logger || {}), level: LogLevelEnum.LOG },
  });
}

export async function eventError<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  message: string,
  eventName: string,
  options: Omit<IEventWithoutEventNameOptions<TFormatter>, 'error'>,
): Promise<any[] | boolean | undefined>;

export async function eventError<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  message: string,
  options: Omit<IEventOptions<TFormatter>, 'error'>,
): Promise<any[] | boolean | undefined>;

export async function eventError<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  message: string,
  eventNameOrOptions: string | Omit<IEventOptions<TFormatter>, 'error'>,
  options?: Omit<IEventWithoutEventNameOptions<TFormatter>, 'error'>,
): Promise<any[] | boolean | undefined> {
  const _options = buildOptions(eventNameOrOptions, options);
  const res = event(message, {
    ..._options,
    logger: { ...(_options.logger || {}), level: LogLevelEnum.ERROR },
    error: false,
  });

  return res;
}

export function eventException<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  message: string,
  eventName: string,
  options: IEventWithoutEventNameOptions<TFormatter>,
): Error | DefaultError | undefined;

export function eventException<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  message: string,
  options: IEventOptions<TFormatter>,
): Error | DefaultError | undefined;

export function eventException<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  message: string,
  eventNameOrOptions: string | IEventOptions<TFormatter>,
  options?: IEventWithoutEventNameOptions<TFormatter>,
): Error | DefaultError | undefined {
  const _options = buildOptions(eventNameOrOptions, options);
  const res = event(message, {
    ..._options,
    logger: { ...(_options.logger || {}), level: LogLevelEnum.ERROR },
    error: _options.error !== false && {
      class:
        typeof _options.error === 'object' && _options.error.class
          ? _options.error.class
          : DefaultError,
    },
  });

  return res as Error | DefaultError | undefined;
}

export async function eventWarn<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  message: string,
  eventName: string,
  options: IEventWithoutEventNameOptions<TFormatter>,
): Promise<any>;

export async function eventWarn<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(message: string, options: IEventOptions<TFormatter>): Promise<any>;

export async function eventWarn<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  message: string,
  eventNameOrOptions: string | IEventOptions<TFormatter>,
  options?: IEventWithoutEventNameOptions<TFormatter>,
): Promise<any> {
  const _options = buildOptions(eventNameOrOptions, options);
  return event(message, {
    ..._options,
    logger: { ...(_options.logger || {}), level: LogLevelEnum.WARN },
  });
}

export async function eventDebug<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  message: string,
  eventName: string,
  options: IEventWithoutEventNameOptions<TFormatter>,
): Promise<any>;

export async function eventDebug<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(message: string, options: IEventOptions<TFormatter>): Promise<any>;

export async function eventDebug<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  message: string,
  eventNameOrOptions: string | IEventOptions<TFormatter>,
  options?: IEventWithoutEventNameOptions<TFormatter>,
): Promise<any> {
  const _options = buildOptions(eventNameOrOptions, options);
  return event(message, {
    ..._options,
    logger: { ...(_options.logger || {}), level: LogLevelEnum.DEBUG },
  });
}

export async function eventVerbose<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  message: string,
  eventName: string,
  options: IEventWithoutEventNameOptions<TFormatter>,
): Promise<any>;

export async function eventVerbose<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(message: string, options: IEventOptions<TFormatter>): Promise<any>;

export async function eventVerbose<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(
  message: string,
  eventNameOrOptions: string | IEventOptions<TFormatter>,
  options?: IEventWithoutEventNameOptions<TFormatter>,
): Promise<any> {
  const _options = buildOptions(eventNameOrOptions, options);
  return event(message, {
    ..._options,
    logger: { ...(_options.logger || {}), level: LogLevelEnum.VERBOSE },
  });
}
