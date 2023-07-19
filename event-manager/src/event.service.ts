import { Inject, Injectable } from '@nestjs/common';
import {
  eventLog,
  eventDebug,
  eventError,
  eventVerbose,
  eventWarn,
  IEventOptions,
  IEventWithoutEventNameOptions,
  eventException,
} from './event.js';
import type { ImprovedLoggerService } from '../../logger/src/logger-abstract.service.js';
import { APP_LOGGER_SERVICE } from '../../app/src/def.const.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNameFormatter } from './emitter.js';

export interface IEventServiceOptions<
  TFormatter extends EventNameFormatter = EventNameFormatter,
> {
  formatter?: TFormatter;
}

@Injectable()
export class Event<TFormatter extends EventNameFormatter = EventNameFormatter> {
  constructor(
    @Inject(APP_LOGGER_SERVICE)
    protected readonly loggerService: ImprovedLoggerService,
    protected readonly eventEmitter: EventEmitter2,
    protected options?: IEventServiceOptions<TFormatter>,
  ) {}

  /**
   * Alias for log
   */
  emit = this.log;

  public async exception(
    message: string,
    eventName: Parameters<TFormatter> | string,
    options: IEventWithoutEventNameOptions<TFormatter>,
  ): Promise<any>;

  public async exception(
    message: string,
    options: IEventOptions<TFormatter>,
  ): Promise<any>;

  public async exception(
    message: string,
    eventNameOrOptions:
      | Parameters<TFormatter>
      | string
      | IEventOptions<TFormatter>,
    options?: IEventWithoutEventNameOptions<TFormatter>,
  ): Promise<any> {
    return eventException(
      message,
      this.buildOptions(eventNameOrOptions, options),
    );
  }

  public async log(
    message: string,
    eventName: Parameters<TFormatter> | string,
    options: IEventWithoutEventNameOptions<TFormatter>,
  ): Promise<any>;

  public async log(
    message: string,
    options: IEventOptions<TFormatter>,
  ): Promise<any>;

  public async log(
    message: string,
    eventNameOrOptions:
      | Parameters<TFormatter>
      | string
      | IEventOptions<TFormatter>,
    options?: IEventWithoutEventNameOptions<TFormatter>,
  ): Promise<any> {
    return eventLog(message, this.buildOptions(eventNameOrOptions, options));
  }

  public async error(
    message: string,
    eventName: Parameters<TFormatter> | string,
    options: Omit<IEventWithoutEventNameOptions<TFormatter>, 'error'>,
  ): Promise<any>;

  public async error(
    message: string,
    options: Omit<IEventOptions<TFormatter>, 'error'>,
  ): Promise<any>;

  public async error(
    message: string,
    eventNameOrOptions:
      | Parameters<TFormatter>
      | string
      | Omit<IEventOptions<TFormatter>, 'error'>,
    options?: Omit<IEventWithoutEventNameOptions<TFormatter>, 'error'>,
  ): Promise<any> {
    return eventError(message, this.buildOptions(eventNameOrOptions, options));
  }

  public async warn(
    message: string,
    eventName: Parameters<TFormatter> | string,
    options: IEventWithoutEventNameOptions<TFormatter>,
  ): Promise<any>;

  public async warn(
    message: string,
    options: IEventOptions<TFormatter>,
  ): Promise<any>;

  public async warn(
    message: string,
    eventNameOrOptions:
      | Parameters<TFormatter>
      | string
      | IEventOptions<TFormatter>,
    options?: IEventWithoutEventNameOptions<TFormatter>,
  ): Promise<any> {
    return eventWarn(message, this.buildOptions(eventNameOrOptions, options));
  }

  public async debug(
    message: string,
    eventName: Parameters<TFormatter> | string,
    options: IEventWithoutEventNameOptions<TFormatter>,
  ): Promise<any>;

  public async debug(
    message: string,
    options: IEventOptions<TFormatter>,
  ): Promise<any>;

  public async debug(
    message: string,
    eventNameOrOptions:
      | Parameters<TFormatter>
      | string
      | IEventOptions<TFormatter>,
    options?: IEventWithoutEventNameOptions<TFormatter>,
  ): Promise<any> {
    return eventDebug(message, this.buildOptions(eventNameOrOptions, options));
  }

  public async verbose(
    message: string,
    eventName: Parameters<TFormatter> | string,
    options: IEventWithoutEventNameOptions<TFormatter>,
  ): Promise<any>;

  public async verbose(
    message: string,
    options: IEventOptions<TFormatter>,
  ): Promise<any>;

  public async verbose(
    message: string,
    eventNameOrOptions:
      | Parameters<TFormatter>
      | string
      | IEventOptions<TFormatter>,
    options?: IEventWithoutEventNameOptions<TFormatter>,
  ): Promise<any> {
    return eventVerbose(
      message,
      this.buildOptions(eventNameOrOptions, options),
    );
  }

  protected buildOptions(
    eventNameOrOptions:
      | string
      | Parameters<TFormatter>
      | IEventOptions<TFormatter>,
    options?: IEventWithoutEventNameOptions<TFormatter>,
  ): IEventOptions<TFormatter> {
    let _options;
    if (
      typeof eventNameOrOptions === 'string' ||
      Array.isArray(eventNameOrOptions)
    ) {
      _options = {
        ...options,
        event: { ...(options?.event ?? {}), name: eventNameOrOptions },
      };
    } else {
      _options = eventNameOrOptions;
    }

    let event: IEventOptions<TFormatter>['event'];
    if (typeof _options.event === 'string') {
      event = { name: _options.event };
    } else if (_options.event !== undefined) {
      event =
        _options.event === false
          ? false
          : {
              ..._options.event,
              nameFormatter:
                _options.event?.nameFormatter ?? this.options?.formatter,
            };
    }

    return {
      ..._options,
      event,
      logger:
        _options.logger === false
          ? false
          : {
              ..._options.logger,
              instance: this.loggerService,
            },
    };
  }
}
