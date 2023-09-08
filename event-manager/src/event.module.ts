import { DynamicModule, LogLevel, Module, Provider } from '@nestjs/common';
import { EventService, IEventServiceOptions } from './event.service.js';
import { ImprovedLoggerService } from '@nestjs-yalc/logger/logger-abstract.service.js';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { AppLoggerFactory } from '@nestjs-yalc/logger/logger.factory.js';
import { ConstructorOptions } from 'eventemitter2';
import { EventNameFormatter } from './emitter.js';
import { isProviderObject } from '@nestjs-yalc/utils/nestjs/nest.helper.js';
import { EventEmitterModuleOptions } from '@nestjs/event-emitter/dist/interfaces/index.js';

export const EVENT_LOGGER = 'EVENT_LOGGER';
export const EVENT_EMITTER = 'EVENT_EMITTER';

function isLoggerOptions(
  loggerProvider?: ImprovedLoggerService | { context: string } | string,
): loggerProvider is { context: string } {
  return (
    loggerProvider !== undefined &&
    typeof loggerProvider === 'object' &&
    'context' in loggerProvider
  );
}

export interface ILoggerProviderOptions {
  context: string;
  loggerLevels?: LogLevel[];
  loggerType?: string;
}

export interface IEventModuleOptions<
  TFormatter extends EventNameFormatter = EventNameFormatter,
> extends IEventServiceOptions<TFormatter> {
  loggerProvider?:
    | ImprovedLoggerService
    | ILoggerProviderOptions
    | Provider<ImprovedLoggerService>
    | string;
  eventEmitter?: EventEmitterModuleOptions | Provider<EventEmitter2>;
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
        : options && isProviderObject(options.loggerProvider)
        ? (options.loggerProvider as any).provide
        : EVENT_LOGGER;
    const emitterProviderName =
      options && isProviderObject(options.eventEmitter)
        ? (options.eventEmitter as any).provide
        : EventEmitter2;

    const eventProviderName = options?.eventServiceToken ?? EventService;

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

    const loggerProvider = options?.loggerProvider;
    if (isProviderObject(loggerProvider)) {
      providers.push(loggerProvider);
    } else {
      providers.push({
        provide: loggerProviderName,
        useFactory: (providedOptions?: IProviderOptions) => {
          const _options = providedOptions?.logger ?? loggerProvider;

          return isLoggerOptions(_options)
            ? AppLoggerFactory(
                _options.context,
                _options.loggerLevels,
                _options.loggerType,
              )
            : options?.loggerProvider;
        },
        inject: [{ token: OPTION_PROVIDER, optional: true }],
      });
    }

    if (options?.eventEmitter && isProviderObject(options.eventEmitter)) {
      providers.push(options.eventEmitter);
    } else {
      imports.push(
        EventEmitterModule.forRoot(
          options?.eventEmitter
            ? (options?.eventEmitter as ConstructorOptions)
            : {},
        ),
      );
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
