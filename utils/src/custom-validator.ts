import { stringIsInEnum } from './validator-helper';

export const stringIsInEnumValidatorFactory = <T>(property: T) => {
  return {
    validate(value: any) {
      return stringIsInEnum(value, property);
    },
  };
};
