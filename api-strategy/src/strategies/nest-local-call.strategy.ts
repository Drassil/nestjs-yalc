import { HttpAdapterHost } from '@nestjs/core';
import {
  HttpAbstractStrategy,
  HttpOptions,
  IHttpCallStrategyResponse,
} from './http-abstract-call.strategy';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ClassType } from '@nestjs-yalc/types';
import { InjectOptions } from 'fastify';

export class NestLocalCallStrategy extends HttpAbstractStrategy {
  constructor(private adapterHost: HttpAdapterHost, private baseUrl = '') {
    super();
  }

  async call<TOptData extends string | object | Buffer | NodeJS.ReadableStream, TResData>(
    path: string,
    options?: HttpOptions<TOptData>,
  ): Promise<IHttpCallStrategyResponse<TResData>> {
    const instance: FastifyAdapter = this.adapterHost.httpAdapter.getInstance();

    /**
     * We need this to do a type check on the options and
     * implement the mapping from HttpOptions to InjectOptions;
     */

    const _options:
      | {
          [k: string | number | symbol]: never;
        }
      | InjectOptions = {
      headers: options?.headers,
      method: options?.method,
      signal: options?.signal,
      payload: options?.data, // map data to payload
    };

    const result = await instance.inject({
      ..._options,
      url: `${this.baseUrl}${path}`,
    });

    return {
      data: JSON.parse(result.body),
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
