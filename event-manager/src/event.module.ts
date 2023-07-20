import {
  DynamicModule,
  Global,
  LogLevel,
  Module,
  Provider,
} from '@nestjs/common';
import { EventService, IEventServiceOptions } from './event.service.js';
import {
  ImprovedLoggerService,
  LoggerAbstractService,
} from '@nestjs-yalc/logger/logger-abstract.service.js';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { AppLoggerFactory } from '@nestjs-yalc/logger/logger.factory.js';
import { ConstructorOptions } from 'eventemitter2';
import { EventNameFormatter } from './emitter.js';

export const EVENT_LOGGER = 'EVENT_LOGGER';
export const EVENT_EMITTER = 'EVENT_EMITTER';

function isLoggerOptions(
  loggerProvider?: ImprovedLoggerService | { context: string },
): loggerProvider is { context: string } {
  return loggerProvider !== undefined && 'context' in loggerProvider;
}

function isConstructorOptions(
  eventEmitter?: EventEmitter2 | ConstructorOptions,
): eventEmitter is ConstructorOptions {
  return eventEmitter !== undefined && 'wildcard' in eventEmitter;
}

export interface ILoggerProviderOptions {
  context: string;
  loggerLevels?: LogLevel[];
  loggerType?: string;
}

export interface IEventModuleOptions<
  TFormatter extends EventNameFormatter = EventNameFormatter,
> extends IEventServiceOptions<TFormatter> {
  loggerProvider?: ImprovedLoggerService | ILoggerProviderOptions | string;
  eventEmitter?: EventEmitter2 | ConstructorOptions | string;
  eventService?: (
    logger: ImprovedLoggerService,
    emitter: EventEmitter2,
    options?: IEventModuleOptions<TFormatter>,
  ) => EventService;
  eventServiceToken?: string;
}

export const OPTION_PROVIDER = 'OPTION_PROVIDER';

export interface IProviderOptions {
  logger: ImprovedLoggerService | ILoggerProviderOptions;
  emitter: EventEmitter2;
}

@Global()
@Module({})
export class EventModule {
  static forRootAsync<
    TFormatter extends EventNameFormatter = EventNameFormatter,
  >(
    options?: IEventModuleOptions<TFormatter>,
    optionProvider?: Provider<IProviderOptions>,
  ): DynamicModule {
    const loggerProviderName =
      typeof options?.loggerProvider === 'string'
        ? options.loggerProvider
        : EVENT_LOGGER;
    const emitterProviderName =
      typeof options?.eventEmitter === 'string'
        ? options.eventEmitter
        : EventEmitter2;

    const eventProviderName = options?.eventServiceToken ?? EventService;

    const isEmitterInstance =
      typeof options?.eventEmitter !== 'string' &&
      !isConstructorOptions(options?.eventEmitter);
    const isLoggerInstance =
      options?.loggerProvider instanceof LoggerAbstractService;

    let imports: any[] = [];
    let providers: Provider[] = [
      {
        provide: eventProviderName,
        useFactory: (logger: ImprovedLoggerService, emitter: EventEmitter2) => {
          return (
            options?.eventService?.(logger, emitter, options) ??
            new EventService(logger, emitter, options)
          );
        },
        inject: [loggerProviderName, emitterProviderName],
      },
    ];

    if (!isLoggerInstance) {
      providers.push({
        provide: loggerProviderName,
        useFactory: (providedOptions: IProviderOptions) => {
          const _options = providedOptions.logger ?? options?.loggerProvider;

          return isLoggerOptions(_options)
            ? AppLoggerFactory(
                _options.context,
                _options.loggerLevels,
                _options.loggerType,
              )
            : options?.loggerProvider;
        },
        inject: [OPTION_PROVIDER],
      });
    } else {
      providers.push({
        provide: loggerProviderName,
        useValue: options?.loggerProvider,
      });
    }

    if (!isEmitterInstance) {
      imports.push(
        EventEmitterModule.forRoot(options?.eventEmitter as ConstructorOptions),
      );
    } else {
      // providers.push({
      //   provide: emitterProviderName,
      //   useFactory: (providedOptions: IProviderOptions) => {
      //     return providedOptions.emitter ?? options?.eventEmitter;
      //   },
      //   inject: [OPTION_PROVIDER],
      // });
    }

    if (optionProvider) {
      providers.push(optionProvider);
    }

    return {
      module: EventModule,
      providers,
      imports,
      exports: [loggerProviderName, eventProviderName],
    };
  }
}
