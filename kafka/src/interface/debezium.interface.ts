export type DebeziumOperation = 'c' | 'r' | 'u' | 'd';

export type DebeziumEvenelope<T> = {
  before: null | T;
  after: null | T;
  op: DebeziumOperation;
};

export type DeserializedData<TKey, TValue> = {
  key: TKey;
  value: DebeziumEvenelope<TValue>;
};
