import { ClassType } from '@nestjs-yalc/types/globals.d.js';
import { HttpService } from '@nestjs/axios';
import {
  HttpAbstractStrategy,
  IHttpCallStrategyResponse,
  HttpOptions,
} from './http-abstract-call.strategy.js';
import { AxiosRequestConfig } from 'axios';

export class NestHttpCallStrategy extends HttpAbstractStrategy {
  constructor(
    protected readonly httpService: HttpService,
    private baseUrl = '',
  ) {
    super();
  }

  async call<TOptData, TParams extends Record<string, any>, TResData>(
    path: string,
    options?: HttpOptions<TOptData, TParams>,
  ): Promise<IHttpCallStrategyResponse<TResData>> {
    /**
     * We need this to do a type check on the options and
     * implement the mapping from HttpOptions to AxiosRequestConfig
     */
    const _options:
      | {
          [k: string | number | symbol]: never;
        }
      | AxiosRequestConfig = {
      headers: options?.headers,
      method: options?.method,
      signal: options?.signal,
      data: options?.data,
    };

    if (options?.parameters) {
      _options.params = new URLSearchParams(options.parameters);
    }

    const { data, ...res } = await this.httpService.axiosRef.request({
      headers: options?.headers,
      method: _options?.method,
      signal: _options?.signal,
      data: _options?.data,
      params: _options?.params,
      url: `${this.baseUrl}${path}`,
    });

    return {
      ...res,
      data,
    };
  }
}

export interface NestHttpCallStrategyProviderOptions {
  baseUrl?: string;
  NestHttpStrategy?: ClassType<NestHttpCallStrategy>;
}

/**
 * Just a convenient provider to inject the NestLocalCallStrategy
 */
export const NestHttpCallStrategyProvider = (
  provide: string,
  options: NestHttpCallStrategyProviderOptions = {},
) => ({
  provide,
  useFactory: (httpAdapter: HttpService) => {
    const _options = {
      baseUrl: '',
      NestHttpStrategy: NestHttpCallStrategy,
      ...options,
    };

    return new _options.NestHttpStrategy(httpAdapter, _options.baseUrl);
  },
  inject: [HttpService],
});
