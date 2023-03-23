export interface IPageDataCrudGen {
  count: number;

  startRow: number;

  endRow: number;
}

export interface IConnection<T = any> {
  nodes: T[];
  pageData: IPageDataCrudGen;
}
