import { ErrorsEnum, ExceptionContextEnum } from '../errors.enum.js';

describe('errors enum test', () => {
  it('ErrorsEnum should have all the values', () => {
    expect(Object.keys(ErrorsEnum)).toEqual([
      'BAD_LOGIN',
      'UNAUTHORIZED',
      'FORBIDDEN_RESOURCE',
      'INVALID_VALUE',
    ]);
  });

  it('ExceptionContextEnum have all the values', () => {
    expect(Object.keys(ExceptionContextEnum)).toEqual([
      'DATABASE',
      'HTTP',
      'SYSTEM',
    ]);
  });
});
