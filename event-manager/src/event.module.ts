import { DynamicModule, Module, Provider } from '@nestjs/common';
import { YalcEventService, IEventServiceOptions } from './event.service.js';
import { ImprovedLoggerService } from '@nestjs-yalc/logger/logger-abstract.service.js';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { AppLoggerFactory } from '@nestjs-yalc/logger/logger.factory.js';
import { ConstructorOptions } from 'eventemitter2';
import { EventNameFormatter } from './emitter.js';
import { isProviderObject } from '@nestjs-yalc/utils/nestjs/nest.helper.js';
import { EventEmitterModuleOptions } from '@nestjs/event-emitter/dist/interfaces/index.js';
import { setGlobalEventEmitter } from './global-emitter.js';

export const EVENT_LOGGER = 'EVENT_LOGGER';
export const EVENT_EMITTER = 'EVENT_EMITTER';

function isImprovedLoggerService(
  loggerProvider?:
    | ImprovedLoggerService
    | ILoggerProviderOptionsObject
    | string,
): loggerProvider is ImprovedLoggerService {
  return (
    loggerProvider !== undefined &&
    typeof loggerProvider === 'object' &&
    'log' in loggerProvider &&
    'error' in loggerProvider &&
    'warn' in loggerProvider
  );
}

export type ILoggerProviderOptions = Parameters<typeof AppLoggerFactory>;

export type ILoggerProviderOptionsObject = {
  context: ILoggerProviderOptions[0];
  loggerLevels?: ILoggerProviderOptions[1];
  loggerType?: ILoggerProviderOptions[2];
  options?: ILoggerProviderOptions[3];
};

export interface IEventModuleOptions<
  TFormatter extends EventNameFormatter = EventNameFormatter,
> extends IEventServiceOptions<TFormatter> {
  loggerProvider?:
    | ImprovedLoggerService
    | ILoggerProviderOptionsObject
    | Provider<ImprovedLoggerService>
    | string;
  eventEmitter?: EventEmitterModuleOptions | Provider<EventEmitter2>;
  eventService?: (
    logger: ImprovedLoggerService,
    emitter: EventEmitter2,
    options?: IEventModuleOptions<TFormatter>,
  ) => YalcEventService;
  eventServiceToken?: string;
  imports?: any[];
}

export const OPTION_PROVIDER = 'OPTION_PROVIDER';

export interface IProviderOptions {
  logger: ImprovedLoggerService | ILoggerProviderOptionsObject;
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

    const eventProviderName = options?.eventServiceToken ?? YalcEventService;

    let imports: any[] = options?.imports ?? [];
    let providers: Provider[] = [
      {
        provide: eventProviderName,
        useFactory: (logger: ImprovedLoggerService, emitter: EventEmitter2) => {
          setGlobalEventEmitter(emitter);

          return (
            options?.eventService?.(logger, emitter, options) ??
            new YalcEventService(logger, emitter, options)
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

          if (isImprovedLoggerService(_options)) {
            return _options;
          } else {
            const defaultArgs: ILoggerProviderOptionsObject = {
              context: 'default',
            };
            const args =
              _options && typeof _options !== 'string' ? _options : defaultArgs;

            return AppLoggerFactory(
              args.context,
              args.loggerLevels,
              args.loggerType,
              args.options,
            );
          }
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
