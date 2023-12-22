import {
  describe,
  expect,
  it,
  jest,
  beforeAll,
  beforeEach,
  test,
} from '@jest/globals';
import { isScientificNotation } from '../math.helper.js';

describe('math helper test', () => {
  it('should return true for scientific notation', () => {
    const result = isScientificNotation(0.000000002);

    expect(result).toBeTruthy();
  });

  it('should return false for non scientific notation', () => {
    const result = isScientificNotation(0.002);

    expect(result).toBeFalsy();
  });
});
