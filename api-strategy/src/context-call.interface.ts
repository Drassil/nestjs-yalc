export interface IObjectWithData<TData> {
  data: TData;
}

export interface ICallOptions<TData, TParams extends Record<string, any>>
  extends IObjectWithData<TData> {
  data: TData;
  parameters: TParams;
}

export interface IApiCallStrategy {
  call<TOptData, TParams extends Record<string, any>, TResData>(
    path: string,
    options?: ICallOptions<TOptData, TParams>,
  ): Promise<IObjectWithData<TResData>>;
  /**
   * alias for call that retrieves data without side effects (read-only)
   */
  get<TOptData, TParams extends Record<string, any>, TResData>(
    path: string,
    options?: ICallOptions<TOptData, TParams>,
  ): Promise<IObjectWithData<TResData>>;
  /**
   * alias for call that retrieves data with side effects (creation of a resource, etc.)
   */
  post<TOptData, TParams extends Record<string, any>, TResData>(
    path: string,
    options?: ICallOptions<TOptData, TParams>,
  ): Promise<IObjectWithData<TResData>>;
}
