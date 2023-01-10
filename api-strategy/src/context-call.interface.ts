export interface IApiCallStrategy<O, R> {
  call(path: string, options?: O): Promise<R>;
  /**
   * shortcut for call(path, { method: 'GET', ...options })
   */
  get(path: string, options?: O): Promise<R>;
  /**
   * shortcut for call(path, { method: 'POST', ...options })
   */
  post(path: string, options?: O): Promise<R>;
}
