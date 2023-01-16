export interface IObjectWithData<TData> {
  data: TData
}

export interface IApiCallStrategy {
  call<TOptData, TResData>(path: string, options?: IObjectWithData<TOptData>): Promise<IObjectWithData<TResData>>;
  /**
   * alias for call that retrieves data without side effects (read-only)
   */
  get<TOptData, TResData>(path: string, options?: IObjectWithData<TOptData>): Promise<IObjectWithData<TResData>>;
  /**
   * alias for call that retrieves data with side effects (creation of a resource, etc.)
   */
  post<TOptData, TResData>(path: string, options?: IObjectWithData<TOptData>): Promise<IObjectWithData<TResData>>;
}
