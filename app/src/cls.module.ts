import { Module } from '@nestjs/common';
import { FastifyRequest } from 'fastify/types/request.js';
import { ClsModule, ClsService } from 'nestjs-cls';
import { ClsStore } from 'nestjs-cls/dist/src/lib/cls.options.js';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export interface IYalcCls extends ClsStore {
  headers: Record<string, string>;
}

/**
 * Global Cls. This is useful if you want to have a single Cls instance for your entire application.
 */
export class YalcGlobalClsService<
  TCls extends IYalcCls = IYalcCls,
> extends ClsService<TCls> {}

export interface IYalcAsyncLocalStorageAls {
  placeholder: string;
}

/**
 * Module specific AsyncLocalStorage. This is useful if you want to have multiple AsyncLocalStorage instances for different modules.
 */
export class YalcAlsService<
  TStorage extends IYalcAsyncLocalStorageAls = IYalcAsyncLocalStorageAls,
> extends AsyncLocalStorage<TStorage> {}

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        // automatically mount the
        // ClsMiddleware for all routes
        mount: true,
        // and use the setup method to
        // provide default store values.
        setup: (cls, req) => {
          cls.set('headers', req.headers);
        },
        /**
         * The generation of the id uses setIfUndefined internally
         * So it won't be overwritten if it's already set (e.g. http local strategy case)
         */
        generateId: true,
        idGenerator: async (req: FastifyRequest) =>
          req.headers['X-Request-Id']?.toString() ?? randomUUID(),
      },
    }),
  ],
  providers: [
    /**
     * @see https://papooch.github.io/nestjs-cls/features-and-use-cases/type-safety-and-type-inference#using-a-custom-provider
     */
    {
      provide: YalcGlobalClsService,
      useExisting: ClsService,
    },
    {
      provide: YalcAlsService,
      useValue: new YalcAlsService(),
    },
  ],
  exports: [YalcGlobalClsService],
})
export class YalcClsModule {}
