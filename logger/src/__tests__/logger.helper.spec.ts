import { describe, expect, it } from '@jest/globals';

const loggerHelper = await import('../logger.helper.js');

const testObject = {
  password: '123',
  foo: 'bar',
  bar: 'foo',
};

describe('test logger helper', () => {
  it('should test the maskDataInObject', () => {
    const subject = loggerHelper.maskDataInObject(testObject);
    expect(subject).toEqual({
      ...testObject,
    });
  });
  it('should test the maskDataInObject with password masking', () => {
    const subject = loggerHelper.maskDataInObject(testObject, ['password']);
    expect(subject).toEqual({
      ...testObject,
      password: '[REDACTED]',
    });
  });
});
