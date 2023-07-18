import { DynamicModule, LogLevel, Module } from '@nestjs/common';
import { Event, IEventServiceOptions } from './event.service.js';
import { ImprovedLoggerService } from '@nestjs-yalc/logger/logger-abstract.service.js';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { AppLoggerFactory } from '@nestjs-yalc/logger/logger.factory.js';
import { ConstructorOptions } from 'eventemitter2';
import { EventNameFormatter } from './emitter.js';
import { ClassType } from '@nestjs-yalc/types/globals.d.js';

export const EVENT_LOGGER = 'EVENT_LOGGER';
export const EVENT_EMITTER = 'EVENT_EMITTER';

function isLoggerOptions(
  loggerProvider?: ImprovedLoggerService | { context: string },
): loggerProvider is { context: string } {
  return loggerProvider !== undefined && 'context' in loggerProvider;
}

export interface IEventModuleOptions<
  TFormatter extends EventNameFormatter = EventNameFormatter,
> extends IEventServiceOptions<TFormatter> {
  loggerProvider?:
    | ImprovedLoggerService
    | { context: string; loggerLevels?: LogLevel[]; loggerType?: string };
  eventEmitter?: EventEmitter2 | ConstructorOptions;
  eventService?: ClassType<Event>;
}

@Module({})
export class EventModule {
  static forRoot<TFormatter extends EventNameFormatter = EventNameFormatter>(
    options?: IEventModuleOptions<TFormatter>,
  ): DynamicModule {
    const loggerProviderName =
      typeof options?.loggerProvider === 'string'
        ? options.loggerProvider
        : EVENT_LOGGER;
    const eventProviderName =
      typeof options?.eventEmitter === 'string'
        ? options.eventEmitter
        : EVENT_EMITTER;
    const isEmitterInstance = options?.eventEmitter instanceof EventEmitter2;

    const _eventService = options?.eventService ?? Event;

    let imports: any[] = [];
    let providers: any[] = [];

    if (!isEmitterInstance) {
      imports.push(
        EventEmitterModule.forRoot(options?.eventEmitter as ConstructorOptions),
      );
    } else {
      providers.push({
        provide: eventProviderName,
        useValue: options?.eventEmitter,
      });
    }

    return {
      module: EventModule,
      providers: [
        {
          provide: _eventService,
          useFactory: (
            logger: ImprovedLoggerService,
            emitter: EventEmitter2,
          ) => {
            return new _eventService(logger, emitter, options);
          },
          inject: [loggerProviderName, eventProviderName],
        },
        {
          provide: loggerProviderName,
          useFactory: () => {
            return isLoggerOptions(options?.loggerProvider)
              ? AppLoggerFactory(
                  options!.loggerProvider.context,
                  options!.loggerProvider.loggerLevels,
                  options!.loggerProvider.loggerType,
                )
              : options?.loggerProvider;
          },
        },
        ...providers,
      ],
      imports,
      exports: [loggerProviderName, eventProviderName],
    };
  }
}
