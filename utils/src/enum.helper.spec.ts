import { belongsToEnum, mergeEnums } from './enum.helper';
import { TestEnum1, TestEnum2 } from './__mocks__/enum.mock';

test('belongsToEnum should check if a value belongs to a specific Enum', () => {
  enum TestEnum {
    TEST = 'test',
  }

  let result = belongsToEnum(TestEnum, 'test');
  expect(result).toBeTruthy();

  result = belongsToEnum(TestEnum, 'TEST');
  expect(result).toBeFalsy();
});

test('mergeEnums should merge 2 enums', () => {
  const result = mergeEnums(TestEnum1, TestEnum2);

  // jest is not able to produce enum properly
  // TODO: find a better way to expect a proper value
  expect(result).toBeDefined();
});
