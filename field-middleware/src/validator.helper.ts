import { FieldErrorsEnum } from './fields-error.enum';

export function convertIfStringToDate(date: Date | string): Date {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date;
}

export function stringIsInEnumOrThrow<T>(
  toCheck: string,
  enumName: T,
  message?: string,
): boolean {
  if (stringIsInEnum(toCheck, enumName)) {
    return true;
  }
  const err = message ? message : `${FieldErrorsEnum.INVALID_VALUE} ${toCheck}`;
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

export function validateDate(date: Date | string): boolean {
  date = convertIfStringToDate(date);
  if (Object.prototype.toString.call(date) === '[object Date]') {
    if (!isNaN(date.getTime())) {
      return true;
    }
  }
  return false;
}

export function validateDateOrThrow(
  date: Date | string,
  message?: string,
): boolean {
  if (validateDate(date)) {
    return true;
  }
  const err = message ? message : `${FieldErrorsEnum.INVALID_VALUE} ${date}`;
  throw new Error(err);
}

export function validateStringFormat(
  str: string,
  stringFormat: string,
): boolean {
  return str.match(stringFormat) !== null;
}
