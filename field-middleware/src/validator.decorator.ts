import { registerDecorator, ValidationOptions } from 'class-validator';
import { StringFormatEnum } from './string-format.enum.js';
import { validateDate, validateStringFormat } from './validator.helper.js';
import { IStringFormatMatchCheckOptions } from './validator.interface.js';

export const stringFormatMatchValidatorFactory = (
  stringMatchOptions: IStringFormatMatchCheckOptions,
) => {
  return {
    validate(string: string) {
      const result = validateStringFormat(string, stringMatchOptions.pattern);
      return stringMatchOptions.toMatch ? result : !result;
    },
  };
};

export const dateValidatorFactory = () => {
  return {
    validate(date: Date | string) {
      return validateDate(date);
    },
  };
};

//Decoratos
export function StringFormatMatchValidation(
  validationOptions?: ValidationOptions,
  stringMatchOptions: IStringFormatMatchCheckOptions = {
    toMatch: true,
    pattern: StringFormatEnum.ALL,
  },
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'stringFormatMatchValidation',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: stringFormatMatchValidatorFactory(stringMatchOptions),
    });
  };
}

export function DateValidation(validationOptions: ValidationOptions = {}) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'dateValidation',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: dateValidatorFactory(),
    });
  };
}
