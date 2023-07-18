import { Inject, Injectable } from '@nestjs/common';
import {
  eventLog,
  eventDebug,
  eventError,
  eventVerbose,
  eventWarn,
  IEventOptions,
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

  public async emit(options: IEventOptions<TFormatter>) {
    return this.log(options);
  }

  public async log(options: IEventOptions<TFormatter>) {
    return eventLog(this.buildOptions({ ...this.options, ...options }));
  }

  public async error(options: IEventOptions<TFormatter>) {
    return eventError(this.buildOptions({ ...this.options, ...options }));
  }

  public async warn(options: IEventOptions<TFormatter>) {
    return eventWarn(this.buildOptions({ ...this.options, ...options }));
  }

  public async debug(options: IEventOptions<TFormatter>) {
    return eventDebug(this.buildOptions({ ...this.options, ...options }));
  }

  public async verbose(options: IEventOptions<TFormatter>) {
    return eventVerbose(this.buildOptions({ ...this.options, ...options }));
  }

  private buildOptions(
    options: IEventOptions<TFormatter>,
  ): IEventOptions<TFormatter> {
    let event: IEventOptions<TFormatter>['event'];
    if (typeof options.event === 'string') {
      // TODO: fix this type
      event = { name: options.event as any };
    } else if (options.event !== undefined) {
      event =
        options.event === false
          ? false
          : {
              ...options.event,
              nameFormatter:
                options.event?.nameFormatter ?? this.options?.formatter,
            };
    }

    return {
      ...options,
      event,
      logger:
        options.logger === false
          ? false
          : {
              ...options.logger,
              instance: this.loggerService,
            },
    };
  }
}
