import { IApiCallStrategy } from '../context-call.interface';

export abstract class HttpAbstractStrategy<Options>
  implements IApiCallStrategy
{
  abstract call(
    path: string,
    options?: Options | { method: string },
  ): Promise<any>;

  get(path: string, options?: Options | { method: string }): Promise<any> {
    return this.call(path, { ...options, method: 'GET' });
  }

  post(path: string, options?: Options | { method: string }): Promise<any> {
    return this.call(path, { ...options, method: 'POST' });
  }
}
