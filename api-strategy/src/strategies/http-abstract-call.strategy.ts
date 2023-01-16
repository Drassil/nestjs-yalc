import { HTTPMethods } from '@nestjs-yalc/types';
import { OutgoingHttpHeaders, IncomingHttpHeaders } from 'node:http2';
import { IApiCallStrategy } from '../context-call.interface';

/**
 * This options should be compliant to all the http-based call strategies
 */
// do not
export interface HttpOptions<TData = string | object | Buffer | NodeJS.ReadableStream> {
  headers?: IncomingHttpHeaders & { [key: string]: string };
  method?: HTTPMethods;
  signal?: AbortSignal;
  Request?: object;
  data?: TData;
}

export interface IHttpCallStrategyResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: OutgoingHttpHeaders;
  // config: AxiosRequestConfig<D>;
  request?: any;
}

export interface IHttpCallStrategy extends IApiCallStrategy {}

export abstract class HttpAbstractStrategy implements IHttpCallStrategy
{
  abstract call<TOptData, TResData>(
    path: string,
    options?: HttpOptions<TOptData> | { method?: string },
  ): Promise<IHttpCallStrategyResponse<TResData>>;

  get<TOptData, TResData>(
    path: string,
    options?: HttpOptions<TOptData>  | { method?: string },
  ): Promise<IHttpCallStrategyResponse<TResData>> {
    return this.call<TOptData,TResData>(path, { ...options, method: 'GET' });
  }

  post<TOptData, TResData>(
    path: string,
    options?: HttpOptions<TOptData>  | { method?: string },
  ): Promise<IHttpCallStrategyResponse<TResData>> {
    return this.call<TOptData,TResData>(path, { ...options, method: 'POST' });
  }
}
