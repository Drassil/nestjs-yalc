import {
  IBaseAppOptions,
  IBaseDynamicModule,
  IBaseStaticModule,
} from './base-app.interface.js';
import {
  APP_ALIAS_TOKEN,
  APP_LOGGER_SERVICE,
  APP_OPTION_TOKEN,
} from './def.const.js';
import { LifeCycleHandler } from './life-cycle-handler.service.js';
import { DynamicModule, Logger } from '@nestjs/common';
import { ConfigModule, registerAs } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerServiceFactory } from '@nestjs-yalc/logger/logger.service.js';
import {
  AppConfigService,
  createAppConfigProvider,
  getAppConfigToken,
} from './app-config.service.js';
import { NODE_ENV } from '@nestjs-yalc/types/global.enum.js';
import Joi from 'joi';
import { AppContextModule } from './app-context.module.js';

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
  return true;
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
  options?: Omit<IBaseAppOptions, 'module'>,
): IBaseStaticModule {
  const isSingleton = options?.isSingleton ?? false;

  const cached = getCachedModule(module, isSingleton);
  if (cached) {
    // Logger.debug(`Using cached metadata for ${module.name}`);
    return cached;
  }

  const envFilePath: string[] = [];

  if (!options?.envPath) {
    Logger.debug(`Loading env from: ${options?.envDir}`);

    envFilePath.push(...envFilePathList(options?.envDir));
  } else {
    envFilePath.push(...options.envPath);
  }

  const configModule = ConfigModule.forRoot({
    envFilePath,
    load: [
      registerAs(appAlias, () => {
        return options?.configFactory?.() ?? {};
      }),
      ...(options?.extraConfigs ?? []),
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
  });

  const _providers: Array<any> = [
    {
      provide: APP_ALIAS_TOKEN,
      useValue: appAlias,
    },
    {
      provide: APP_OPTION_TOKEN,
      useValue: options,
    },
    LoggerServiceFactory(appAlias, APP_LOGGER_SERVICE, appAlias),
    LifeCycleHandler,
    createAppConfigProvider(appAlias),
    /**
     * Alias
     */
    {
      provide: AppConfigService,
      useExisting: getAppConfigToken(appAlias),
    },
  ];

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { controllers, exports, imports, providers } = options ?? {};

  if (providers) {
    _providers.push(...providers);
  }

  let _imports: DynamicModule['imports'] = [
    configModule,
    EventEmitterModule.forRoot(),
    AppContextModule,
  ];

  if (imports) {
    _imports.push(...imports);
  }

  const _exports: DynamicModule['exports'] = [
    APP_LOGGER_SERVICE,
    getAppConfigToken(appAlias),
    AppConfigService,
  ];

  if (exports) {
    _exports.push(...exports);
  }

  const _controllers: DynamicModule['controllers'] = [];

  if (controllers && options?.isStandalone !== true) {
    _controllers.push(...controllers);
  }

  const config = {
    imports: _imports,
    exports: _exports,
    controllers: _controllers,
    providers: _providers,
  };

  registerSingletonDynamicModule(isSingleton, module, config);

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
    options?: IBaseAppOptions,
  ): IBaseDynamicModule {
    return this.assignDynamicProperties(
      yalcBaseAppModuleMetadataFactory(this, appAlias, {
        isStandalone: true,
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
    options?: IBaseAppOptions,
  ): IBaseDynamicModule {
    return this.assignDynamicProperties(
      yalcBaseAppModuleMetadataFactory(this, appAlias, {
        isStandalone: false,
        ...options,
      }),
      options,
    );
  }

  protected static assignDynamicProperties(
    config: any,
    options?: IBaseAppOptions,
  ) {
    config.module = this;
    config.global = options?.global ?? true;
    config.isSingleton = options?.isSingleton ?? false;

    return config;
  }
}
