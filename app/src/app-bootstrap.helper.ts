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

export interface IGlobalOptions {
  /**
   * On some cases we do want to manually override the apiPrefix of the service conf
   */
  apiPrefix?: string;
  filters?: ExceptionFilter[];
}

export class AppBootstrap {
  private app?: NestFastifyApplication;
  private fastifyInstance?: FastifyInstance;
  protected loggerService?: LoggerService;

  constructor(
    private appAlias: string,
    private appConfAlias: string,
    private readonly module: DynamicModule,
  ) {}

  async startServer(options?: {
    globalsOptions?: IGlobalOptions;
    fastifyInstance?: FastifyInstance;
  }) {
    await this.initApp(options);

    this.listen();

    return this;
  }

  async initApp(options?: {
    globalsOptions?: IGlobalOptions;
    fastifyInstance?: FastifyInstance;
  }) {
    await this.createApp({
      fastifyInstance: this.fastifyInstance,
    });

    this.applyBootstrapGlobals(options?.globalsOptions);

    await this.getApp().init();

    return this;
  }

  async createApp(options?: { fastifyInstance?: FastifyInstance }) {
    this.fastifyInstance = options?.fastifyInstance ?? fastify();

    return this.setApp(
      await NestFactory.create<NestFastifyApplication>(
        this.module,
        new FastifyAdapter(this.fastifyInstance as any),
      ),
    );
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
    return configService.get<IServiceConf>(this.appConfAlias);
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

  applyBootstrapGlobals(options?: IGlobalOptions) {
    this.getApp().useGlobalPipes(
      new ValidationPipe({ validateCustomDecorators: true }),
    );
    this.loggerService = this.getApp().get(APP_LOGGER_SERVICE);

    this.getApp().setGlobalPrefix(
      options?.apiPrefix ?? (this.getConf()?.apiPrefix || ''),
    );
    this.getApp().useLogger(this.loggerService);
    this.getApp().register(fastifyCookie as any, {});

    /**
     * @todo refactor using a factory function to share with all services
     */
    const filters = [
      new SystemExceptionFilter(this.loggerService),
      ...(options?.filters ?? []),
    ];
    this.getApp().useGlobalFilters(...filters);

    const config = new DocumentBuilder()
      .setTitle(this.appAlias)
      .setDescription(`${this.appAlias} rest api`)
      .setVersion('3.0')
      // .addTag('cats')
      .build();
    const document = SwaggerModule.createDocument(this.getApp(), config);
    SwaggerModule.setup('api', this.getApp(), document);

    return this;
  }

  async listen(callback?: {
    (port: number, host: string, domain: string): void;
  }) {
    const port = this.getConf()?.port || 0;
    const host = this.getConf()?.host || '0.0.0.0';
    let apiPrefix = this.getConf()?.apiPrefix;
    apiPrefix = apiPrefix ? `/${apiPrefix}` : '';
    const domain = this.getConf()?.domain || 'localhost';
    await this.getApp().listen(port, host, () => {
      // eslint-disable-next-line no-console
      console.debug(`Server ${this.appAlias} listening on
        http://localhost:${port}${apiPrefix}/
        http://127.0.0.1:${port}${apiPrefix}/
        http://${domain}:${port}${apiPrefix}/`);

      // // eslint-disable-next-line no-console
      // console.debug(`GraphQL ${this.appAlias} listening on
      //   http://localhost:${port}${apiPrefix}/graphql
      //   http://127.0.0.1:${port}${apiPrefix}/graphql
      //   http://${domain}:${port}${apiPrefix}/graphql`);

      // // eslint-disable-next-line no-console
      // console.debug(`Swagger ${this.appAlias} listening on
      //   http://localhost:${port}${apiPrefix}/api
      //   http://127.0.0.1:${port}${apiPrefix}/api
      //   http://${domain}:${port}${apiPrefix}/api`);``

      callback?.(port, host, domain);
    });
  }
}
