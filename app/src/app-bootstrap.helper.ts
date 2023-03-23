import {
  // DatabaseExceptionFilter,
  // HttpExceptionFilter,
  // ValidationExceptionFilter,
  SystemExceptionFilter,
} from '@nestjs-yalc/errors/filters/index.js';
import {
  DynamicModule,
  ExceptionFilter,
  LoggerService,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
// import { GqlExceptionFilter } from '@nestjs/graphql';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import type { IServiceConf } from './conf.type.js';
import { APP_LOGGER_SERVICE } from './def.const.js';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { fastify, FastifyInstance } from 'fastify';
import { envIsTrue } from '@nestjs-yalc/utils/env.helper.js';
import { useContainer } from 'class-validator';
import clc from 'cli-color';

export interface IGlobalOptions {
  /**
   * On some cases we do want to manually override the apiPrefix of the service conf
   */
  apiPrefix?: string;
  filters?: ExceptionFilter[];
  abortOnError?: boolean;
}

export class AppBootstrap {
  private app?: NestFastifyApplication;
  private fastifyInstance?: FastifyInstance;
  protected loggerService?: LoggerService;

  constructor(
    private appAlias: string,
    private readonly module: DynamicModule,
  ) {}

  async startServer(options?: {
    globalsOptions?: IGlobalOptions;
    fastifyInstance?: FastifyInstance;
  }) {
    await this.initApp(options);

    if (envIsTrue(process.env.APP_DRY_RUN) === true) {
      await this.getApp().close;
      process.exit(0);
    }

    // no need to wait here
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.listen();

    return this;
  }

  async initApp(options?: {
    globalsOptions?: IGlobalOptions;
    fastifyInstance?: FastifyInstance;
  }) {
    await this.createApp({
      fastifyInstance: this.fastifyInstance,
      globalsOptions: options?.globalsOptions,
    });

    await this.applyBootstrapGlobals(options?.globalsOptions);

    await this.getApp().init();

    if (envIsTrue(process.env.APP_DRY_RUN) === true) {
      this.loggerService?.log('Dry run, exiting...');
      await this.getApp().close;
      process.exit(0);
    }

    return this;
  }

  async createApp(options?: {
    globalsOptions?: IGlobalOptions;
    fastifyInstance?: FastifyInstance;
  }) {
    this.fastifyInstance = options?.fastifyInstance ?? fastify();

    let app;
    try {
      app = await NestFactory.create<NestFastifyApplication>(
        this.module,
        new FastifyAdapter(this.fastifyInstance as any),
        {
          bufferLogs: false,
          abortOnError: options?.globalsOptions?.abortOnError ?? false,
        },
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(clc.red('Failed to create app'), clc.red(err));
      throw new Error('Process aborted');
    }

    useContainer(app.select(this.module), { fallbackOnErrors: true });

    return this.setApp(app);
  }

  getFastifyInstance() {
    return this.fastifyInstance;
  }

  setApp(app: NestFastifyApplication) {
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

  async applyBootstrapGlobals(options?: IGlobalOptions) {
    this.getApp().useGlobalPipes(
      new ValidationPipe({ validateCustomDecorators: true }),
    );
    this.loggerService = this.getApp().get(APP_LOGGER_SERVICE);

    this.getApp().setGlobalPrefix(
      options?.apiPrefix ?? (this.getConf()?.apiPrefix || ''),
    );
    this.getApp().useLogger(this.loggerService);
    await this.getApp().register(fastifyCookie as any, {});

    /**
     * @todo refactor using a factory function to share with all services
     */
    const filters = [
      new SystemExceptionFilter(this.loggerService),
      ...(options?.filters ?? []),
    ];
    this.getApp().useGlobalFilters(...filters);

    const document = SwaggerModule.createDocument(
      this.getApp(),
      this.buildSwaggerConfig().build(),
    );
    SwaggerModule.setup('api', this.getApp(), document);

    return this;
  }

  buildSwaggerConfig() {
    return new DocumentBuilder()
      .setTitle(this.appAlias)
      .setDescription(`${this.appAlias} rest api`);
  }

  async listen(callback?: {
    (port: number, host: string, domain: string): void;
  }) {
    const port = this.getConf()?.port || 0;
    const host = this.getConf()?.host || '0.0.0.0';
    let apiPrefix = this.getConf()?.apiPrefix;
    apiPrefix = apiPrefix ? `/${apiPrefix}` : '';
    const domain = this.getConf()?.domain || 'localhost';
    await this.getApp().listen(port, host, (_err, address) => {
      // eslint-disable-next-line no-console
      console.debug(`Server ${this.appAlias} listening on
        http://localhost:${port}${apiPrefix}/
        http://127.0.0.1:${port}${apiPrefix}/
        http://${domain}:${port}${apiPrefix}/
        ${address}`);

      // // eslint-disable-next-line no-console
      // console.debug(`GraphQL ${this.appAlias} listening on
      //   http://localhost:${port}${apiPrefix}/graphql
      //   http://127.0.0.1:${port}${apiPrefix}/graphql
      //   http://${domain}:${port}${apiPrefix}/graphql`);

      // eslint-disable-next-line no-console
      console.debug(`Swagger ${this.appAlias} listening on
        http://localhost:${port}${apiPrefix}/api
        http://127.0.0.1:${port}${apiPrefix}/api
        http://${domain}:${port}${apiPrefix}/api
        ${address}/api`);

      callback?.(port, host, domain);
    });
  }
}
