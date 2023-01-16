import { ClassType } from '@nestjs-yalc/types';
import { HttpService } from '@nestjs/axios';
import {
  HttpAbstractStrategy,
  IHttpCallStrategyResponse,
  HttpOptions
} from './http-abstract-call.strategy';
import { AxiosRequestConfig } from 'axios';

export class NestHttpCallStrategy extends HttpAbstractStrategy {
  constructor(
    protected readonly httpService: HttpService,
    private baseUrl = '',
  ) {
    super();
  }

  async call<TOptData, TResData>(
    path: string,
    options?: HttpOptions<TOptData>,
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

    const { data , ...res } = await this.httpService.axiosRef.request({
      ..._options,
      url: `${this.baseUrl}${path}`,
    });

    return {
      ...res,
      data: typeof data === 'string' ? JSON.parse(data) : data,
    }
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
