import { INestApplicationContext, LoggerService, Type } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { GqlExceptionFilter } from '@nestjs/graphql';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { IServiceConf } from './conf.type.js';
import { SYSTEM_LOGGER_SERVICE } from './def.const.js';

export abstract class BaseAppBootstrap<
  TAppType extends NestFastifyApplication | INestApplicationContext,
  TGlobalOptions = unknown,
> {
  protected app?: TAppType;
  protected loggerService!: LoggerService;

  constructor(
    protected appAlias: string,
    protected readonly module: Type<any>,
  ) {}

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
