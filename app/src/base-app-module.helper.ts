import {
  IYalcBaseAppOptions,
  IYalcBaseDynamicModule,
  IYalcBaseStaticModule,
} from './base-app.interface.js';
import {
  APP_ALIAS_TOKEN,
  APP_LOGGER_SERVICE,
  APP_OPTION_TOKEN,
  MODULE_ALIAS_TOKEN,
  SYSTEM_LOGGER_SERVICE,
} from './def.const.js';
import { LifeCycleHandler } from './life-cycle-handler.service.js';
import { DynamicModule, Logger } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerServiceFactory } from '@nestjs-yalc/logger/logger.service.js';
import {
  AppConfigService,
  createAppConfigProvider,
  getAppConfigToken,
} from './app-config.service.js';
import { AppContextModule } from './app-context.module.js';
import { NODE_ENV } from '@nestjs-yalc/types/global.enum.js';
import { ConfigModule, registerAs } from '@nestjs/config';
import Joi from 'joi';
import { MODULE_OPTIONS_TOKEN } from '@nestjs/common/cache/cache.module-definition.js';

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

function _metadataFactory(
  module: any,
  appAlias: string,
  options?: Omit<IYalcBaseAppOptions, 'module'>,
) {
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
  ];

  if (options?.logger) {
    _providers.push(
      LoggerServiceFactory(appAlias, APP_LOGGER_SERVICE, appAlias),
    );
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
    );
  }

  if (imports) {
    _imports.push(...imports);
  }

  const _exports: DynamicModule['exports'] = [];

  if (hasConfig) {
    _exports.push(getAppConfigToken(appAlias), AppConfigService);
  }

  if (exports) {
    _exports.push(...exports);
  }

  const _controllers: DynamicModule['controllers'] = [];

  if (controllers && _options.isStandalone !== true) {
    _controllers.push(...controllers);
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
 * Used for applications with controller/resolver support
 * you should override it
 */
export function yalcBaseAppModuleMetadataFactory(
  module: any,
  appAlias: string,
  options?: Omit<IYalcBaseAppOptions, 'module'>,
): IYalcBaseStaticModule {
  const config = _metadataFactory(module, appAlias, options);

  if (!options || !options.skipDefaultApp) {
    config.imports.push(YalcDefaultAppModule.forRoot(appAlias, options));
  }

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
    options?: Omit<IYalcBaseAppOptions, 'module'>,
  ) {
    const imports: NonNullable<DynamicModule['imports']> = [
      EventEmitterModule.forRoot(),
      AppContextModule,
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

    if (options?.logger) {
      providers.push(
        LoggerServiceFactory(appAlias, APP_LOGGER_SERVICE, appAlias),
        {
          provide: SYSTEM_LOGGER_SERVICE,
          useFactory: (logger) => logger,
          inject: [APP_LOGGER_SERVICE],
        },
      );
    }

    const exports: NonNullable<DynamicModule['exports']> = [
      APP_OPTION_TOKEN,
      APP_ALIAS_TOKEN,
    ];

    if (options?.logger) {
      exports.push(APP_LOGGER_SERVICE, SYSTEM_LOGGER_SERVICE);
    }

    /**
     * This is a workaround to make sure that the DefaultAppModule is always injected
     * with the last configurations, basically the ones defined from the app itself
     *
     * NOTE: The best way is to use the isApp flag to always identify when a module is an App
     */
    const config = registerSingletonDynamicModule(
      true,
      YalcDefaultAppModule,
      {},
    );
    const newConfig = yalcBaseAppModuleMetadataFactory(
      YalcDefaultAppModule,
      `YalcDef-${appAlias}`,
      {
        global: true,
        isSingleton: false,
        logger: false,
        isStandalone: options?.isStandalone,
        skipDefaultApp: true,
        skipDuplicateAppCheck: true,
        imports,
        providers,
        exports,
      },
    ) as IYalcBaseDynamicModule;

    Object.assign(config, newConfig);

    config.module = YalcDefaultAppModule;
    config.global = true;
    config.isSingleton = true;

    return config;
  }
}
