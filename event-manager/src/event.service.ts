import { Injectable } from '@nestjs/common';
import {
  eventLogAsync,
  eventDebugAsync,
  eventErrorAsync,
  eventVerboseAsync,
  eventWarnAsync,
  IEventOptions,
  eventException,
  eventDebug,
  eventError,
  eventLog,
  eventVerbose,
  eventWarn,
} from './event.js';
import type { ImprovedLoggerService } from '../../logger/src/logger-abstract.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNameFormatter } from './emitter.js';
import { DefaultError } from '@nestjs-yalc/errors/default.error.js';

export interface IEventServiceOptions<
  TFormatter extends EventNameFormatter = EventNameFormatter,
> {
  formatter?: TFormatter;
}

@Injectable()
export class EventService<
  TFormatter extends EventNameFormatter = EventNameFormatter,
> {
  constructor(
    protected readonly loggerService: ImprovedLoggerService,
    protected readonly eventEmitter: EventEmitter2,
    protected options?: IEventServiceOptions<TFormatter>,
  ) {}

  get logger(): ImprovedLoggerService {
    return this.loggerService;
  }

  get emitter(): EventEmitter2 {
    return this.eventEmitter;
  }

  /**
   * Alias for log
   */
  emit = this.log;

  public exception(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): Error | DefaultError | undefined {
    return eventException(eventName, this.buildOptions(options));
  }

  public async logAsync(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): Promise<any> {
    return eventLogAsync(eventName, this.buildOptions(options));
  }

  public async errorAsync(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IEventOptions<TFormatter>, 'error'>,
  ): Promise<any> {
    return eventErrorAsync(eventName, this.buildOptions(options));
  }

  public async warnAsync(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): Promise<any> {
    return eventWarnAsync(eventName, this.buildOptions(options));
  }

  public async debugAsync(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): Promise<any> {
    return eventDebugAsync(eventName, this.buildOptions(options));
  }

  public async verboseAsync(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): Promise<any> {
    return eventVerboseAsync(eventName, this.buildOptions(options));
  }

  public log(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): any {
    return eventLog(eventName, this.buildOptions(options));
  }

  public error(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IEventOptions<TFormatter>, 'error'>,
  ): any {
    return eventError(eventName, this.buildOptions(options));
  }

  public warn(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): any {
    return eventWarn(eventName, this.buildOptions(options));
  }

  public debug(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): any {
    return eventDebug(eventName, this.buildOptions(options));
  }

  public verbose(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): any {
    return eventVerbose(eventName, this.buildOptions(options));
  }

  /**
   * Merges the methods options with the constructor options.
   */
  protected buildOptions(
    options?: IEventOptions<TFormatter>,
  ): IEventOptions<TFormatter> {
    let _options = { ...options };

    let event: IEventOptions<TFormatter>['event'];
    if (_options?.event !== undefined || this.eventEmitter) {
      event =
        _options.event === false
          ? false
          : {
              ..._options?.event,
              emitter: _options?.event?.emitter ?? this.eventEmitter,
              formatter: _options?.event?.formatter ?? this.options?.formatter,
            };
    }

    return {
      ..._options,
      event,
      logger:
        _options?.logger === false
          ? false
          : {
              ..._options?.logger,
              instance: this.loggerService,
            },
    };
  }
}
