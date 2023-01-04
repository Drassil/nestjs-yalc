import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { HttpAbstractStrategy } from './http-abstract-call.strategy';

export class NestHttpCallStrategy extends HttpAbstractStrategy<AxiosRequestConfig> {
  constructor(
    protected readonly httpService: HttpService,
    private baseUrl = '',
  ) {
    super();
  }

  call<T = any>(path: string, options: AxiosRequestConfig): Promise<T> {
    return this.httpService.axiosRef.request({
      ...options,
      url: `${this.baseUrl}${path}`,
    });
  }
}

/**
 * Just a convenient provider to inject the NestLocalCallStrategy
 */
export const NestHttpCallStrategyProvider = (
  provide: string,
  baseUrl = '',
) => ({
  provide,
  useFactory: (httpAdapter: HttpService) => {
    return new NestHttpCallStrategy(httpAdapter, baseUrl);
  },
  inject: [HttpService],
});
