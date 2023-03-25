import {
  describe,
  expect,
  it,
  jest,
  beforeAll,
  beforeEach,
  test,
} from '@jest/globals';
import { stringIsInEnumValidatorFactory } from '../custom-validator.js';

describe('stringIsInEnumValidatorFactory', () => {
  enum TestEnum {
    Value1 = 'Value1',
    Value2 = 'Value2',
  }

  it('should validate if a string is in the enum', () => {
    const validator = stringIsInEnumValidatorFactory(TestEnum);

    const validString = 'Value1';
    const invalidString = 'Invalid';

    expect(validator.validate(validString)).toBe(true);
    expect(validator.validate(invalidString)).toBe(false);
  });

  it('should call stringIsInEnum with the right arguments', () => {
    const validator = stringIsInEnumValidatorFactory(TestEnum);

    const validString = 'Value1';
    expect(validator.validate(validString)).toBe(true);
  });
});
