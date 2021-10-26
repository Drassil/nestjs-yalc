import { envIsTrue, envToArray } from './env.helper';

describe('environment helper test', () => {
  it('should convert a comma separated list to an array', () => {
    process.env.Test = 'apple,pear,pineapple,cherry';
    const res = envToArray('Test');
    expect(res).toEqual(['apple', 'pear', 'pineapple', 'cherry']);
  });

  it('should return an empty array when the var is an empty string', () => {
    process.env.Test = '';
    const res = envToArray('Test');
    expect(res).toEqual([]);
  });

  it('should return an empty array when the var is missing', () => {
    delete process.env.Test;
    const res = envToArray('Test');
    expect(res).toEqual([]);
  });

  it('should return false for "undefined"', () => {
    expect(envIsTrue(undefined)).toEqual(false);
  });

  it('should return true for "true"', () => {
    expect(envIsTrue('true')).toEqual(true);
  });

  it('should return true for "1"', () => {
    expect(envIsTrue('1')).toEqual(true);
  });

  it('should return true for "on"', () => {
    expect(envIsTrue('on')).toEqual(true);
  });
});
