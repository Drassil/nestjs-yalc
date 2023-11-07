import {
  IYalcBaseAppOptions,
  IYalcBaseDynamicModule,
  IYalcBaseStaticModule,
} from './base-app.interface.js';
import {
  APP_ALIAS_TOKEN,
  APP_EVENT_SERVICE,
  APP_LOGGER_SERVICE,
  APP_OPTION_TOKEN,
  MAIN_APP_CONFIG_SERVICE,
  MODULE_ALIAS_TOKEN,
  SYSTEM_EVENT_SERVICE,
  SYSTEM_LOGGER_SERVICE,
} from './def.const.js';
import { LifeCycleHandler } from './life-cycle-handler.service.js';
import { DynamicModule, Logger } from '@nestjs/common';
import { LoggerServiceFactory } from '@nestjs-yalc/logger/logger.service.js';
import {
  AppConfigService,
  createAppConfigProvider,
  getAppConfigToken,
  getAppEventToken,
  getAppLoggerToken,
} from './app-config.service.js';
import { AppContextModule } from './app-context.module.js';
import { NODE_ENV } from '@nestjs-yalc/types/global.enum.js';
import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import Joi from 'joi';
import { MODULE_OPTIONS_TOKEN } from '@nestjs/common/cache/cache.module-definition.js';
import { IGlobalOptions } from './app-bootstrap.helper.js';
import { EventModule } from '@nestjs-yalc/event-manager/index.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { YalcClsModule } from './cls.module.js';
import { IYalcControllerStaticInterface } from './yalc-controller.interface.js';

const singletonDynamicModules = new Map<any, any>();

export function registerSingletonDynamicModule(
  isSingleton: boolean,
  moduleToken: any,
  module: any,
): any | true {
  if (!isSingleton) {
    return false;
  }

  const cached = singletonDynamicModules.get(moduleToken);
  if (cached) {
    return cached;
  }

  singletonDynamicModules.set(moduleToken, module);
  return singletonDynamicModules.get(moduleToken);
}

export function getCachedModule(module: any, isSingleton: boolean) {
  if (isSingleton) {
    return singletonDynamicModules.get(module);
  }
  return null;
}

export function envFilePathList(dirname: string = '.') {
  const envFilePath: string[] = [];

  envFilePath.push(`${dirname}/.env`); // user-defined env (git-ignored)

  if (process.env.NODE_ENV) {
    envFilePath.push(`${dirname}/.env.${process.env.NODE_ENV}`); // user-defined env (git-ignored)
  }

  // .env.dist is always loaded except in production
  if (process.env.NODE_ENV !== 'production')
    envFilePath.push(`${dirname}/.env.dist`);

  return envFilePath;
}

/**
 * Used for applications with controller/resolver support
 * you should override it
 */
export function yalcBaseAppModuleMetadataFactory(
  module: any,
  appAlias: string,
  options?: Omit<IYalcBaseAppOptions, 'module'>,
): IYalcBaseStaticModule {
  const _options = {
    // default values
    isSingleton: false,
    global: true,
    // user defined values
    ...(options ?? {}),
  };
  const { controllers, exports, imports, providers } = _options;

  const cached = getCachedModule(module, _options.isSingleton);
  if (cached) {
    // Logger.debug(`Using cached metadata for ${module.name}`);
    return cached;
  }

  const _providers: Array<any> = [
    {
      provide: MODULE_ALIAS_TOKEN,
      useValue: appAlias,
    },
    {
      provide: MODULE_OPTIONS_TOKEN,
      useValue: options,
    },
    {
      provide: APP_EVENT_SERVICE,
      useExisting: 'INTERNAL_APP_EVENT_SERVICE',
    },
    {
      provide: getAppEventToken(appAlias),
      useExisting: 'INTERNAL_APP_EVENT_SERVICE',
    },
  ];

  if (options?.logger) {
    _providers.push(
      (options?.logger === true ? LoggerServiceFactory : options?.logger)(
        appAlias,
        APP_LOGGER_SERVICE,
        appAlias,
      ),
    );

    _providers.push({
      provide: getAppLoggerToken(appAlias),
      useExisting: APP_LOGGER_SERVICE,
    });
  }

  const hasConfig = _options.extraConfigs || _options.configFactory;

  if (hasConfig) {
    _providers.push(
      createAppConfigProvider(appAlias),
      /**
       * Alias
       */
      {
        provide: AppConfigService,
        useExisting: getAppConfigToken(appAlias),
      },
    );
  }

  if (!_options.skipDuplicateAppCheck) {
    _providers.push(LifeCycleHandler);
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention

  if (providers) {
    _providers.push(...providers);
  }

  let _imports: DynamicModule['imports'] = [];

  if (hasConfig) {
    const envFilePath: string[] = [];

    if (!_options.envPath) {
      Logger.debug(`Loading env from: ${_options.envDir}`);

      envFilePath.push(...envFilePathList(_options.envDir));
    } else {
      envFilePath.push(..._options.envPath);
    }

    _imports.push(
      EventModule.forRootAsync({
        loggerProvider: {
          provide: 'INTERNAL_APP_LOGGER_SERVICE',
          useExisting: getAppLoggerToken(appAlias),
        },
        eventServiceToken: 'INTERNAL_APP_EVENT_SERVICE',
        eventEmitter: {
          global: true,
          wildcard: true,
          maxListeners: 1000,
        },
      }),
      ConfigModule.forRoot({
        envFilePath,
        load: [
          registerAs(appAlias, async () => {
            /**
             * @see https://docs.nestjs.com/techniques/configuration#environment-variables-loaded-hook
             */
            await ConfigModule.envVariablesLoaded;

            return await (_options.configFactory?.() ?? {});
          }),
          ...(_options.extraConfigs ?? []),
        ],
        validationSchema: Joi.object({
          NODE_ENV: Joi.string()
            .valid(
              NODE_ENV.DEVELOPMENT,
              NODE_ENV.PRODUCTION,
              NODE_ENV.TEST,
              NODE_ENV.PIPELINE,
            )
            .default(NODE_ENV.DEVELOPMENT),
        }),
        validationOptions: {
          allowUnknown: true,
          abortEarly: true,
        },
        /**
         * It can be global because the ConfigService registers configurations by using an alias, hence there won't be any conflict
         * It allows us to use the ConfigService in any module without having to import the ConfigModule
         */
        isGlobal: true,
      }),
      YalcClsModule,
    );
  }

  if (imports) {
    _imports.push(...imports);
  }

  const _exports: DynamicModule['exports'] = [getAppEventToken(appAlias)];

  if (options?.logger) {
    _exports.push(getAppLoggerToken(appAlias));
  }

  if (hasConfig) {
    _exports.push(getAppConfigToken(appAlias));
  }

  if (exports) {
    _exports.push(...exports);
  }

  const _controllers: DynamicModule['controllers'] = [];

  if (controllers) {
    _controllers.push(
      ...controllers.map((c) => {
        (c as unknown as IYalcControllerStaticInterface)._appAlias = appAlias;
        return c;
      }),
    );
  }

  const config = {
    imports: _imports,
    exports: _exports,
    controllers: _controllers,
    providers: _providers,
  };

  registerSingletonDynamicModule(_options.isSingleton, module, config);

  return config;
}

/**
 * Util class that can be extended to create a NestJS application
 */
export class YalcBaseAppModule {
  /**
   * Used by the CLI and other non-network processes
   * you should override it
   *
   * NOTE: if you need singleton dynamic modules, you should use the `isSingleton` property
   * but in most of the cases is better to use the static module instead
   */
  protected static _forRootStandalone(
    appAlias: string,
    options?: IYalcBaseAppOptions,
  ): IYalcBaseDynamicModule {
    return this.assignDynamicProperties(
      yalcBaseAppModuleMetadataFactory(this, appAlias, {
        isStandalone: true,
        ...this.assignDynamicProperties({}),
        ...options,
      }),
      options,
    );
  }

  /**
   * Used for applications with controller/resolver support
   * you should override it
   *
   * NOTE: if you need singleton dynamic modules, you should use the `isSingleton` property
   * but in most of the cases is better to use the static module instead
   */
  protected static _forRoot(
    appAlias: string,
    options?: IYalcBaseAppOptions,
  ): IYalcBaseDynamicModule {
    return this.assignDynamicProperties(
      yalcBaseAppModuleMetadataFactory(this, appAlias, {
        isStandalone: false,
        ...this.assignDynamicProperties({}),
        ...options,
      }),
      options,
    );
  }

  public static assignDynamicProperties(
    config: any,
    options?: IYalcBaseAppOptions,
  ) {
    config.module = this;
    config.global = options?.global ?? true;
    config.isSingleton = options?.isSingleton ?? false;

    return config;
  }
}

/**
 * This class is used to create true singleton providers
 */
export class YalcDefaultAppModule {
  static forRoot(
    appAlias: string,
    imports: NonNullable<DynamicModule['imports']>,
    options?: IGlobalOptions,
  ) {
    const _imports: NonNullable<DynamicModule['imports']> = [
      (options?.eventModuleClass ?? EventModule).forRootAsync({
        loggerProvider: {
          provide: 'INTERNAL_SYSTEM_LOGGER_SERVICE',
          useExisting: SYSTEM_LOGGER_SERVICE,
        },
        eventServiceToken: 'INTERNAL_SYSTEM_EVENT_SERVICE',
        eventEmitter: { wildcard: true, global: true },
      }),
      AppContextModule,
      YalcClsModule,
      ...imports,
    ];

    const providers: NonNullable<DynamicModule['providers']> = [
      {
        provide: APP_ALIAS_TOKEN,
        useValue: appAlias,
      },
      {
        provide: APP_OPTION_TOKEN,
        useValue: options,
      },
    ];

    providers.push(
      {
        provide: SYSTEM_LOGGER_SERVICE,
        useFactory: (configService, eventEmitter) => {
          const loggerFactory = options?.logger ?? LoggerServiceFactory;

          return loggerFactory(appAlias, SYSTEM_LOGGER_SERVICE, appAlias, {
            event: {
              eventEmitter: eventEmitter,
            },
          }).useFactory(configService, eventEmitter);
        },
        inject: [MAIN_APP_CONFIG_SERVICE, EventEmitter2],
      },
      {
        provide: MAIN_APP_CONFIG_SERVICE,
        useFactory: (config: ConfigService) => {
          return new AppConfigService(config, appAlias);
        },
        inject: [ConfigService],
      },
      {
        provide: SYSTEM_EVENT_SERVICE,
        useExisting: 'INTERNAL_SYSTEM_EVENT_SERVICE',
      },
    );

    const exports: NonNullable<DynamicModule['exports']> = [
      APP_OPTION_TOKEN,
      APP_ALIAS_TOKEN,
      SYSTEM_LOGGER_SERVICE,
      SYSTEM_EVENT_SERVICE,
      MAIN_APP_CONFIG_SERVICE,
    ];

    return {
      exports,
      providers,
      imports: _imports,
      module: YalcDefaultAppModule,
      global: true,
    };
  }
}
