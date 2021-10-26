import { belongsToEnum } from './enum.helper';

test(' belongsToEnum should check if a value belongs to a specific Enum', () => {
  enum TestEnum {
    TEST = 'test',
  }

  let result = belongsToEnum(TestEnum, 'test');
  expect(result).toBeTruthy();

  result = belongsToEnum(TestEnum, 'TEST');
  expect(result).toBeFalsy();
});
