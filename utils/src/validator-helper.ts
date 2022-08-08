import { ErrorsEnum } from '@nestjs-yalc/errors/errors.enum';

export function stringIsInEnumOrThrow<T>(
  toCheck: string,
  enumName: T,
  message?: string,
): boolean {
  if (stringIsInEnum(toCheck, enumName)) {
    return true;
  }
  const err = message ? message : `${ErrorsEnum.INVALID_VALUE} ${toCheck}`;
  throw new Error(err);
}

export function stringIsInEnum<T>(toCheck: string, enumName: T): boolean {
  for (const enumProperty of Object.values(enumName)) {
    if (enumProperty.toLowerCase() === toCheck.toLowerCase()) {
      return true;
    }
  }
  return false;
}
