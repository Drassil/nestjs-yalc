export type IFieldMapper<T = any> = {
  [k in keyof T]: FieldMapperProperty;
};

export const isFieldMapper = (object: any): object is IFieldMapper => {
  const casted = object as IFieldMapper;
  const values = Object.values(casted);
  return values.length > 0 && values.every((p) => !!p.dst);
};

export const isFieldMapperProperty = (
  object: Record<string, any>,
): object is FieldMapperProperty => {
  return object && !!object.dst;
};

/**
 * @todo refactor or move this file to put the "filter logic" inside the ag-grid library instead:
 * move isRequired, isSymbolic and denyFilter in a separated interface within the ag-grid library
 * which extends FieldMapperProperty
 *
 */

export type FieldMapperProperty = {
  src?: string;
  /**
   * dst will be used to map in a bidirectional way the name of the requested
   * field to the string specified in dst property
   */
  dst: string;
  /**
   * if true, this property will be used to add the field to the list of
   * the required fields even though the client do not ask for it
   * It is particularly useful when you need to use foreign keys
   */
  isRequired?: boolean;
  /**
   * if true, this property will be ignored from the database find conditions (but still included in the graphql filters)
   * It is particularly useful when you need to use special data in your endpoint
   */
  isSymbolic?: boolean;
  /**
   * if denyFilter is true, this property can't be used as a filter
   */
  denyFilter?: boolean;

  mode?: 'derived' | 'virtual' | 'regular';

  /**
   * internally used
   */
  _propertyName?: string;
};
