import { ClassType } from '@nestjs-yalc/types';
import { HttpService } from '@nestjs/axios';
import {
  HttpAbstractStrategy,
  HttpOptions,
} from './http-abstract-call.strategy';
import { AxiosRequestConfig } from 'axios';

export class NestHttpCallStrategy<
  Options extends HttpOptions = HttpOptions,
> extends HttpAbstractStrategy {
  constructor(
    protected readonly httpService: HttpService,
    private baseUrl = '',
  ) {
    super();
  }

  call<T = any>(path: string, options?: Options): Promise<T> {
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
      data: options?.payload,
    };

    return this.httpService.axiosRef.request({
      ..._options,
      url: `${this.baseUrl}${path}`,
    });
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
