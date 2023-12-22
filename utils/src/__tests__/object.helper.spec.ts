import { describe, expect, it } from '@jest/globals';
import {
  deepMerge,
  objectSetProp,
  isObject,
  isObjectStrict,
} from '../object.helper.js';

describe('test object.helper.ts', () => {
  it('should set a property correctly', () => {
    const obj: any = {};
    objectSetProp(obj, 'test', 1);
    expect(obj.test).toBe(1);
  });

  it('should set a subproperty correctly', () => {
    const obj: any = {};
    const res = objectSetProp(obj, 'test.foo', 1);
    expect(obj.test.foo).toBe(1);
    expect(res.test.foo).toBe(1);
  });

  it('should merge 2 objects correctly', () => {
    const obj1 = { test: 1, sub: { test2: 2 }, array: [1, 2, 4] };
    const obj2 = {
      test: 2,
      sub: { test3: 3 },
      new: {
        test4: 4,
      },
      array: [3, 4, 5],
    };

    const res = deepMerge(obj1, obj2);

    expect(res).toStrictEqual({
      test: 2,
      sub: {
        test2: 2,
        test3: 3,
      },
      new: {
        test4: 4,
      },
      array: [1, 2, 4, 3, 5],
    });
  });

  it('should merge objects  correctly (last undefined)', () => {
    const obj1 = { test: 1, sub: { test2: 2 } };

    const res = deepMerge(obj1);

    expect(res).toStrictEqual({
      test: 1,
      sub: {
        test2: 2,
      },
    });
  });

  it('should isObjectStrict return true', () => {
    expect(isObjectStrict({})).toBe(true);
    expect(isObjectStrict({ test: 1 })).toBe(true);
    expect(isObjectStrict({ test: 1, sub: { test2: 2 } })).toBe(true);
    expect(isObjectStrict(new Object('something'))).toBe(true);
  });

  it('should isObjectStrict return false', () => {
    expect(isObjectStrict(null)).toBe(false);
    expect(isObjectStrict(undefined)).toBe(false);
    expect(isObjectStrict(1)).toBe(false);
    expect(isObjectStrict('string')).toBe(false);
    expect(isObjectStrict(true)).toBe(false);
    expect(isObjectStrict(false)).toBe(false);
    expect(isObjectStrict([1, 2, 3])).toBe(false);
    expect(isObjectStrict(new Date())).toBe(false);
    expect(isObjectStrict(() => {})).toBe(false);
  });

  it('should isObject return true', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ test: 1 })).toBe(true);
    expect(isObject({ test: 1, sub: { test2: 2 } })).toBe(true);
    expect(isObject(new Object('something'))).toBe(true);
    expect(isObject(null)).toBe(false);
    expect(isObject(() => {})).toBe(true);
  });

  it('should isObject return false', () => {
    expect(isObject(undefined)).toBe(false);
    expect(isObject(1)).toBe(false);
    expect(isObject('string')).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(false)).toBe(false);
    expect(isObject([1, 2, 3])).toBe(false);
  });
});
