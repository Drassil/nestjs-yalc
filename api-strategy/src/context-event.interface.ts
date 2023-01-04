export interface IEventStrategy {
  emit(path: string, payload: any, options?: any): any;
  emitAsync(path: string, payload: any, options?: any): Promise<any>;
}
