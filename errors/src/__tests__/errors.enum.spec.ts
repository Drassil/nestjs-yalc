import {
  expect,
  jest,
  describe,
  it,
  beforeEach,
  beforeAll,
  afterAll,
  afterEach,
} from '@jest/globals';
import { ErrorsEnum, ExceptionContextEnum } from '../error.enum.js';

describe('errors enum test', () => {
  it('ErrorsEnum should have all the values', () => {
    expect(Object.keys(ErrorsEnum)).toEqual(
      expect.arrayContaining([
        'BAD_LOGIN',
        'UNAUTHORIZED',
        'FORBIDDEN_RESOURCE',
        'INVALID_VALUE',
      ]),
    );
  });

  it('ExceptionContextEnum have all the values', () => {
    expect(Object.keys(ExceptionContextEnum)).toEqual([
      'DATABASE',
      'HTTP',
      'SYSTEM',
    ]);
  });
});
