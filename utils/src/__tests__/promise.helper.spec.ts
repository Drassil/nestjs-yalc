import {
  describe,
  expect,
  it,
  jest,
  beforeAll,
  beforeEach,
  test,
} from '@jest/globals';
import { promiseMap } from '../promise.helper.js';

describe('promise helper test', () => {
  const elements = [1, 2];

  it('It should resolve promises correctly with explicit options', async () => {
    const result = await promiseMap(elements, async (element) => element, {
      concurrency: 10,
      stopOnError: false,
    });

    expect(result).toEqual(elements);
  });

  it('It should resolve promises correctly with implicit options', async () => {
    const result = await promiseMap(elements, async (element) => element);

    expect(result).toEqual(elements);
  });
});
