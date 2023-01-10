export interface IEventStrategy<P = any, R = any, O = any> {
  emit(path: string, payload: P, options?: O): R;
  emitAsync(path: string, payload: P, options?: O): Promise<R>;
}
