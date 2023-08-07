import { ImprovedLoggerService } from '@nestjs-yalc/logger/logger-abstract.service.js';
import {
  IBaseAppOptions,
  IBaseDynamicModule,
  IBaseStaticModule,
} from './base-app.interface.js';
import { APP_LOGGER_SERVICE } from './def.const.js';
import { LifeCycleHandler } from './life-cycle-handler.service.js';
import { DynamicModule, Logger, Module } from '@nestjs/common';
import { ConfigModule, registerAs } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerServiceFactory } from '@nestjs-yalc/logger/logger.service.js';
import { createAppConfigProvider } from './app-config.service.js';
import { NODE_ENV } from '@nestjs-yalc/types/global.enum.js';
import Joi from 'joi';

const singletonDynamicModules = new Map<any, any>();

/**
 * We can use this "hack" to make sure that our nest apps (global modules) are only imported once even when you use dynamic modules
 *
 * @see https://github.com/nestjs/nest/issues/3519#issuecomment-560287805
 */
export function filterSingletonDynamicModules(importedModules: any[]) {
  return importedModules.filter((module) => {
    const moduleToken = (module as unknown as DynamicModule).module ?? module;
    if (!(module as unknown as IBaseDynamicModule).isSingleton) return true; // not singleton, so we don't care

    return registerSingletonDynamicModule(moduleToken, module) === true;
  });
}

export function useCachedModuleIfPossible(
  isSingleton: boolean,
  moduleToken: any,
  module: any,
) {
  if (!isSingleton) return module;

  const cached = registerSingletonDynamicModule(moduleToken, module);

  if (cached !== true) {
    return cached;
  }

  return module;
}

export function registerSingletonDynamicModule(
  moduleToken: any,
  module: any,
): any | true {
  const cached = singletonDynamicModules.get(moduleToken);
  if (cached) {
    return cached;
  }

  singletonDynamicModules.set(moduleToken, module);
  return true;
}

export function createLifeCycleHandlerProvider(
  appAlias: string,
  options?: IBaseAppOptions,
) {
  return {
    provide: LifeCycleHandler,
    useFactory: (logger: ImprovedLoggerService) =>
      new LifeCycleHandler(logger, appAlias, options),
    inject: [APP_LOGGER_SERVICE],
  };
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
export function baseAppModuleMetadataFactory(
  module: any,
  appAlias: string,
  options?: Omit<IBaseAppOptions, 'module'>,
): IBaseStaticModule {
  const cachedModule = singletonDynamicModules.get(module);
  if (options?.isSingleton && cachedModule) {
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
    LoggerServiceFactory(appAlias, APP_LOGGER_SERVICE, appAlias),
    createLifeCycleHandlerProvider(appAlias, options),
    createAppConfigProvider(appAlias),
  ];

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { controllers, exports, imports, providers } = options ?? {};

  if (providers) {
    _providers.push(...providers);
  }

  let _imports: DynamicModule['imports'] = [
    configModule,
    EventEmitterModule.forRoot(),
  ];

  if (imports) {
    _imports.push(...imports);
  }

  _imports = filterSingletonDynamicModules(_imports);

  const _exports: DynamicModule['exports'] = [APP_LOGGER_SERVICE];

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

  return useCachedModuleIfPossible(
    options?.isSingleton ?? false,
    module,
    config,
  );
}

@Module(baseAppModuleMetadataFactory(YalcBaseAppModule, 'BaseApp'))
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
    return {
      ...this.dynamicProperties(options),
      ...baseAppModuleMetadataFactory(this, appAlias, {
        isStandalone: true,
        ...options,
      }),
    };
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
    return {
      ...this.dynamicProperties(options),
      ...baseAppModuleMetadataFactory(this, appAlias, {
        isStandalone: true,
        ...options,
      }),
    };
  }

  protected static dynamicProperties(options?: IBaseAppOptions) {
    return {
      module: this,
      global: options?.global ?? true,
      isSingleton: options?.isSingleton ?? true,
    };
  }
}
