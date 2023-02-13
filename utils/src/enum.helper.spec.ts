import { belongsToEnum, mergeEnums } from './enum.helper.js';
import { TestEnum1, TestEnum2 } from './__mocks__/enum.mock.js';

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
  const compareWith = {
    ...TestEnum1,
    ...TestEnum2,
  };

  expect(result).toMatchObject(compareWith);
});
