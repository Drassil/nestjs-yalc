import { HttpAdapterHost } from '@nestjs/core';
import {
  HttpAbstractStrategy,
  HttpOptions,
  IHttpCallStrategyResponse,
} from './http-abstract-call.strategy.js';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ClassType } from '@nestjs-yalc/types/globals.d.js';
import { InjectOptions } from 'fastify';

export class NestLocalCallStrategy extends HttpAbstractStrategy {
  constructor(private adapterHost: HttpAdapterHost, private baseUrl = '') {
    super();
  }

  async call<
    TOptData extends string | object | Buffer | NodeJS.ReadableStream,
    TParams extends Record<string, any>,
    TResData,
  >(
    path: string,
    options?: HttpOptions<TOptData, TParams>,
  ): Promise<IHttpCallStrategyResponse<TResData>> {
    const instance: FastifyAdapter = this.adapterHost.httpAdapter.getInstance();
    const headers = {
      ...options?.headers,
    };
    /**
     * We need this to do a type check on the options and
     * implement the mapping from HttpOptions to InjectOptions;
     */
    const _options:
      | {
          [k: string | number | symbol]: never;
        }
      | InjectOptions = {
      headers,
      method: options?.method,
      /**@todo investigate where to set thi */
      // signal: options?.signal,
      payload: options?.data, // map data to payload
    };

    const args: InjectOptions = {
      ..._options,
      url: `${this.baseUrl}${path}`,
    };

    if (options?.parameters) {
      args.query = Object.fromEntries(new URLSearchParams(options.parameters));
    }

    const result = await instance.inject(args);

    let data;
    try {
      data = result.json();
    } catch (_e) {
      //The content-type of the response is not application/json
      // if so, we use the body instead
      data = result.body;
    }

    return {
      data,
      headers: result.headers,
      status: result.statusCode,
      statusText: result.statusMessage,
      request: result.payload, // TODO: double check if it's the correct value
    };
  }
}

export interface NestLocalCallStrategyProviderOptions {
  baseUrl?: string;
  NestLocalStrategy?: ClassType<NestLocalCallStrategy>;
}

/**
 * Just a convenient provider to inject the NestLocalCallStrategy
 */
export const NestLocalCallStrategyProvider = (
  provide: string,
  options: NestLocalCallStrategyProviderOptions = {},
) => ({
  provide,
  useFactory: (httpAdapter: HttpAdapterHost) => {
    const _options = {
      baseUrl: '',
      NestLocalStrategy: NestLocalCallStrategy,
      ...options,
    };

    return new _options.NestLocalStrategy(httpAdapter, _options.baseUrl);
  },
  inject: [HttpAdapterHost],
});
