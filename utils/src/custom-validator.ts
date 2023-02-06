import { stringIsInEnum } from './validator-helper.js';

export const stringIsInEnumValidatorFactory = <
  T extends Record<string, string | number>,
>(
  property: T,
) => {
  return {
    validate(value: any) {
      return stringIsInEnum(value, property);
    },
  };
};
