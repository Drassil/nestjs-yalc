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

export interface IEventOptions<
  TFormatter extends EventNameFormatter = EventNameFormatter,
> {
  message: string;
  data?: {
    payload: any;
    mask?: string[];
    trace?: string;
  };
  event?:
    | {
        name: Parameters<TFormatter>;
        emitter?: EventEmitter2;
        nameFormatter?: TFormatter;
      }
    | string
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

export async function event<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>({ message, logger, data, event, error }: IEventOptions<TFormatter>) {
  let dataPayload = data?.payload;
  if (data?.mask) dataPayload = maskDataInObject(data.payload, data.mask);

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
      loggerInstance.error(message, data?.trace, { masks: data?.mask });
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
    if (typeof event === 'string') {
      eventEmitter = getEventEmitter();
      name = event as any; // TODO: fix this type
    } else {
      eventEmitter = event?.emitter ?? getEventEmitter();
      name = event?.name;
      formatter = event?.nameFormatter;
    }

    result = await emitEvent<TFormatter>(eventEmitter, name, dataPayload, {
      formatter,
      mask: data?.mask,
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
    );
  }

  return result;
}

export async function eventLog<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(options: IEventOptions<TFormatter>) {
  return event({
    ...options,
    logger: { ...(options.logger || {}), level: LogLevelEnum.LOG },
  });
}

export async function eventError<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(options: IEventOptions<TFormatter>) {
  return event({
    ...options,
    logger: { ...(options.logger || {}), level: LogLevelEnum.ERROR },
    error: options.error !== false && {
      class:
        typeof options.error === 'object' && options.error.class
          ? options.error.class
          : DefaultError,
    },
  });
}

export async function eventWarn<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(options: IEventOptions<TFormatter>) {
  return event({
    ...options,
    logger: { ...(options.logger || {}), level: LogLevelEnum.WARN },
  });
}

export async function eventDebug<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(options: IEventOptions<TFormatter>) {
  return event({
    ...options,
    logger: { ...(options.logger || {}), level: LogLevelEnum.DEBUG },
  });
}

export async function eventVerbose<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(options: IEventOptions<TFormatter>) {
  return event({
    ...options,
    logger: { ...(options.logger || {}), level: LogLevelEnum.VERBOSE },
  });
}
