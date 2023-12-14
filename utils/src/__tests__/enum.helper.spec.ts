import {
  describe,
  expect,
  it,
  jest,
  beforeAll,
  beforeEach,
  test,
} from '@jest/globals';

import {
  belongsToEnum,
  mergeEnums,
  getEnumValueByEnumKey,
} from '../enum.helper.js';
import { TestEnum1, TestEnum2 } from '../__mocks__/enum.mock.js';

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

test('getEnumValueByEnumKey should return value of enum 1 by key of enum 2', () => {
  const result = getEnumValueByEnumKey(TestEnum1, Object.keys(TestEnum2)[0]);
  console.log(Object.keys(TestEnum2)[0]);
  expect(result).toBe('test2');
});

test('getEnumValueByEnumKey should return null when no undefined key is provided ', () => {
  const result = getEnumValueByEnumKey(TestEnum1, undefined);
  console.log(Object.keys(TestEnum2)[0]);
  expect(result).toBe(undefined);
});
