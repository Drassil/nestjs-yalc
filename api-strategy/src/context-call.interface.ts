export interface IApiCallStrategy {
  call(path: string, options?: any): Promise<any>;
  /**
   * shortcut for call(path, { method: 'GET', ...options })
   */
  get(path: string, options?: any): Promise<any>;
  /**
   * shortcut for call(path, { method: 'POST', ...options })
   */
  post(path: string, options?: any): Promise<any>;
}
