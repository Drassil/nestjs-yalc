import { isClass } from '../class.helper.js';
import {
  describe,
  expect,
  it,
  jest,
  beforeAll,
  beforeEach,
} from '@jest/globals';

describe('Test Class Helpers', () => {
  it('should test a class correctly', () => {
    expect(isClass(class {})).toBeTruthy();
  });

  it('should test a class correctly', () => {
    expect(
      isClass(function (nothing: any) {
        nothing;
      }),
    ).toBeFalsy();
  });
});
