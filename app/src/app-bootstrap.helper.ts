import { SystemExceptionFilter } from '@nestjs-yalc/errors/filters/index.js';
import {
  BadRequestException,
  DynamicModule,
  ExceptionFilter,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
// import { GqlExceptionFilter } from '@nestjs/graphql';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { fastify, FastifyInstance } from 'fastify';
import { envIsTrue } from '@nestjs-yalc/utils/env.helper.js';
import { useContainer } from 'class-validator';
import clc from 'cli-color';
import { BaseAppBootstrap } from './app-bootstrap-base.helper.js';
import { YalcDefaultAppModule } from './base-app-module.helper.js';

export interface IGlobalOptions {
  /**
   * On some cases we do want to manually override the apiPrefix of the service conf
   */
  apiPrefix?: string;
  filters?: ExceptionFilter[];
  abortOnError?: boolean;
  enableSwagger?: boolean;
  validationPipeOptions?: ValidationPipeOptions;
  appAlias: string;
  extraImports?: NonNullable<DynamicModule['imports']>;
}

export class AppBootstrap extends BaseAppBootstrap<NestFastifyApplication> {
  private fastifyInstance?: FastifyInstance;
  protected isSwaggerEnabled: boolean = false;

  constructor(appAlias: string, readonly module: any) {
    super(appAlias, module);
  }

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

    return this.initSetup(options);
  }

  async initSetup(options?: {
    globalsOptions?: IGlobalOptions;
    fastifyInstance?: FastifyInstance;
  }) {
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

    const appModule = YalcDefaultAppModule.forRoot(
      this.appAlias,
      [this.module, ...(options?.globalsOptions?.extraImports ?? [])],
      options?.globalsOptions,
    );

    let app;
    try {
      app = await NestFactory.create<NestFastifyApplication>(
        appModule,
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

    return this.setApp(app);
  }

  getFastifyInstance() {
    return this.fastifyInstance;
  }

  setSwaggerEnabled(enabled: boolean) {
    this.isSwaggerEnabled = enabled;
  }

  async applyBootstrapGlobals(options?: IGlobalOptions) {
    await super.applyBootstrapGlobals(options);

    this.getApp().useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        validateCustomDecorators: true,
        exceptionFactory: (errors) => {
          const errorMessages: { [key: string]: any } = {};
          errors.forEach((error) => {
            errorMessages[error.property] = error;
          });
          return new BadRequestException(errorMessages);
        },
        ...(options?.validationPipeOptions ?? {}),
      }),
    );

    this.getApp().setGlobalPrefix(
      options?.apiPrefix ?? (this.getConf()?.apiPrefix || ''),
    );

    await this.getApp().register(fastifyCookie as any, {});

    /**
     * @todo refactor using a factory function to share with all services
     */
    const filters = [
      new SystemExceptionFilter(this.loggerService),
      ...(options?.filters ?? []),
    ];
    this.getApp().useGlobalFilters(...filters);

    if (options?.enableSwagger) {
      this.setSwaggerEnabled(true);
      const document = SwaggerModule.createDocument(
        this.getApp(),
        this.buildSwaggerConfig().build(),
      );
      SwaggerModule.setup('api', this.getApp(), document);
    }

    useContainer(this.getApp().select(this.getModule()), {
      fallbackOnErrors: true,
    });

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

      if (this.isSwaggerEnabled) {
        // eslint-disable-next-line no-console
        console.debug(`Swagger ${this.appAlias} listening on
        http://localhost:${port}${apiPrefix}/api
        http://127.0.0.1:${port}${apiPrefix}/api
        http://${domain}:${port}${apiPrefix}/api
        ${address}/api`);
      }

      callback?.(port, host, domain);
    });
  }
}
