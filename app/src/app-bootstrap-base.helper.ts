import {
  DynamicModule,
  INestApplicationContext,
  LoggerService,
  Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { GqlExceptionFilter } from '@nestjs/graphql';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { IServiceConf } from './conf.type.js';
import { SYSTEM_LOGGER_SERVICE } from './def.const.js';
import { YalcDefaultAppModule } from './base-app-module.helper.js';
import { IGlobalOptions } from './app-bootstrap.helper.js';

export abstract class BaseAppBootstrap<
  TAppType extends NestFastifyApplication | INestApplicationContext,
  TGlobalOptions = IGlobalOptions,
> {
  protected app?: TAppType;
  protected loggerService!: LoggerService;
  protected module: Type<any> | DynamicModule;

  constructor(
    protected appAlias: string,
    protected readonly appModule: Type<any>,
    options?: { globalsOptions?: IGlobalOptions },
  ) {
    this.module = YalcDefaultAppModule.forRoot(
      this.appAlias,
      [appModule, ...(options?.globalsOptions?.extraImports ?? [])],
      options?.globalsOptions,
    );
  }

  setApp(app: TAppType) {
    this.app = app;

    return this;
  }

  getConf() {
    const configService = this.getApp().get<ConfigService>(ConfigService);
    return configService.get<IServiceConf>(this.appAlias);
  }

  getApp() {
    if (!this.app) {
      throw new Error('This app is not initialized yet');
    }

    return this.app;
  }

  /**
   *
   * @returns The main module of the business logic (the one that is passed in the constructor)
   */
  getAppModule() {
    return this.appModule;
  }

  /**
   *
   * @returns The global module that is used to bootstrap the app (YalcDefaultAppModule)
   */
  getModule() {
    return this.module;
  }

  async applyBootstrapGlobals(_options?: TGlobalOptions) {
    this.loggerService = this.getApp().get(SYSTEM_LOGGER_SERVICE);
    this.loggerService.debug?.('Setting logger service...');
    this.getApp().useLogger(this.loggerService);
    return this;
  }
}
