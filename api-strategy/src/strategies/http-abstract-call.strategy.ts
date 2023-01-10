import { HTTPMethods } from '@nestjs-yalc/types';
import { OutgoingHttpHeaders, IncomingHttpHeaders } from 'node:http2';
import { IApiCallStrategy } from '../context-call.interface';

/**
 * This options should be compliant to all the http-based call strategies
 */
// do not
export interface HttpOptions {
  headers?: IncomingHttpHeaders & { [key: string]: string };
  method?: HTTPMethods;
  signal?: AbortSignal;
  Request?: object;
  data?: string | object | Buffer | NodeJS.ReadableStream;
}

export interface IHttpCallStrategyResponse<T = any> {
  data: T | string;
  status: number;
  statusText: string;
  headers: OutgoingHttpHeaders;
  // config: AxiosRequestConfig<D>;
  request?: any;
}

export interface IHttpCallStrategy<Options extends HttpOptions = HttpOptions>
  extends IApiCallStrategy<Options, any> {}

export abstract class HttpAbstractStrategy<
  Options extends HttpOptions = HttpOptions,
> implements IHttpCallStrategy
{
  abstract call<R = any>(
    path: string,
    options?: Options | { method?: string },
  ): Promise<IHttpCallStrategyResponse<R>>;

  get<R = any>(
    path: string,
    options?: Options | { method?: string },
  ): Promise<IHttpCallStrategyResponse<R>> {
    return this.call<R>(path, { ...options, method: 'GET' });
  }

  post<R = any>(
    path: string,
    options?: Options | { method?: string },
  ): Promise<IHttpCallStrategyResponse<R>> {
    return this.call<R>(path, { ...options, method: 'POST' });
  }
}
