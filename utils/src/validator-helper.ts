import { ErrorsEnum } from '@nestjs-yalc/errors';

export function stringIsInEnumOrThrow<
  T extends Record<string, string | number>,
>(toCheck: string, enumName: T, message?: string): boolean {
  if (stringIsInEnum(toCheck, enumName)) {
    return true;
  }
  const err = message ? message : `${ErrorsEnum.INVALID_VALUE} ${toCheck}`;
  throw new Error(err);
}

export function stringIsInEnum<T extends Record<string, string | number>>(
  toCheck: string,
  enumName: T,
): boolean {
  for (const enumProperty of Object.values(enumName)) {
    if (
      typeof enumProperty === 'string' &&
      enumProperty.toLowerCase() === toCheck.toLowerCase()
    ) {
      return true;
    }
  }
  return false;
}
