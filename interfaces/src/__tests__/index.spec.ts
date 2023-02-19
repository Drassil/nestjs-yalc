import {
  expect,
  jest,
  describe,
  it,
  beforeEach,
  beforeAll,
  afterAll,
  test,
} from '@jest/globals';
import * as index from '../index.js';

// just to avoid warning, that no tests in test file
describe('Index test', () => {
  test('index should be defined', () => {
    expect(index).toBeDefined();
  });
});
