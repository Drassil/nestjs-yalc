import { HTTPMethods } from '@nestjs-yalc/types';
import { IncomingHttpHeaders } from 'node:http';
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

export interface IHttpCallStrategy<Options extends HttpOptions = HttpOptions>
  extends IApiCallStrategy<Options, any> {}

export abstract class HttpAbstractStrategy<
  Options extends HttpOptions = HttpOptions,
> implements IHttpCallStrategy
{
  abstract call(
    path: string,
    options?: Options | { method?: string },
  ): Promise<any>;

  get(path: string, options?: Options | { method?: string }): Promise<any> {
    return this.call(path, { ...options, method: 'GET' });
  }

  post(path: string, options?: Options | { method?: string }): Promise<any> {
    return this.call(path, { ...options, method: 'POST' });
  }
}
