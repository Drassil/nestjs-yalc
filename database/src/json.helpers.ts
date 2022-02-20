export const NYALC_JSON_FIELD_META_KEY = Symbol(
  'nestjs_yalc_json_field_meta_key',
);
export const NYALC_JSON_VIRTUAL_FIELD_META_KEY =
  'nestjs_yalc_json_virtual_field_meta_key';

/**
 * Check if the passed SQL contains a JSON selector syntax
 * @todo: improve the logic
 * @param sql
 * @returns
 */
export function isJsonSQLRaw(sql: string): boolean {
  return sql.includes('->') && sql.includes('$.');
}

/**
 * Decorator to instruct the JsonEntityMixin which fields
 * should be handled as JSON
 * @returns Decorator function
 */
export function JsonField() {
  return (target: any, property: string | symbol) => {
    const propertyName = property.toString();

    const metadata: { [key: string]: boolean } = {
      ...Reflect.getMetadata(NYALC_JSON_FIELD_META_KEY, target),
    };

    metadata[propertyName] = true;

    Reflect.defineMetadata(NYALC_JSON_FIELD_META_KEY, metadata, target);
  };
}
