import { deepMerge, objectSetProp } from './object.helper.js';

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
});
