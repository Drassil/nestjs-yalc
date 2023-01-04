import { InjectOptions } from 'light-my-request';
import { HttpAdapterHost } from '@nestjs/core';
import { HttpAbstractStrategy } from './http-abstract-call.strategy';

export class NestLocalCallStrategy extends HttpAbstractStrategy<InjectOptions> {
  constructor(private adapterHost: HttpAdapterHost, private baseUrl = '') {
    super();
  }

  call(path: string, options?: InjectOptions): Promise<any> {
    return this.adapterHost.httpAdapter
      .getInstance()
      .inject({ ...options, url: `${this.baseUrl}${path}` });
  }
}

/**
 * Just a convenient provider to inject the NestLocalCallStrategy
 */
export const NestLocalCallStrategyProvider = (
  provide: string,
  baseUrl = '',
) => ({
  provide,
  useFactory: (httpAdapter: HttpAdapterHost) => {
    return new NestLocalCallStrategy(httpAdapter, baseUrl);
  },
  inject: [HttpAdapterHost],
});
