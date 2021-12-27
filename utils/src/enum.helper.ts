/**
 * Used to check if a value is contained in a enum object
 * @param enumObj
 * @param value
 * @returns `boolean`
 */
export const belongsToEnum = <T>(
  enumObj: T,
  value: string | number
): boolean => {
  return Object.values(enumObj).includes(value);
};
