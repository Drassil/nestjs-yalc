import { Spread } from '@nestjs-yalc/types';

/**
 * Used to check if a value is contained in a enum object
 * @param enumObj
 * @param value
 * @returns `boolean`
 */
export const belongsToEnum = <T>(
  enumObj: T,
  value: string | number,
): boolean => {
  return Object.values(enumObj).includes(value);
};

type Merge<T extends readonly any[]> = T extends readonly [infer H, ...infer R]
  ? Spread<H, Merge<R>>
  : // eslint-disable-next-line @typescript-eslint/ban-types
    {};

export const mergeEnums = <T extends any[]>(...enums: T) => {
  let merged = {};
  enums.forEach((e) => (merged = { ...merged, ...e }));
  return merged as any as Merge<T>;
};
