import { ErrorsEnum, ExceptionContextEnum } from '../errors.enum';

describe('errors enum test', () => {
  it('ErrorsEnum should have all the values', () => {
    expect(Object.keys(ErrorsEnum)).toEqual([
      'BAD_LOGIN',
      'UNAUTHORIZED',
      'FORBIDDEN_RESOURCE',
      'INVALID_VALUE',
      'INVALID_PHONE',
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
