import {
  expect,
  jest,
  describe,
  it,
  beforeEach,
  beforeAll,
  afterAll,
  afterEach,
} from '@jest/globals';
import { HttpAbstractStrategy } from '../strategies/http-abstract-call.strategy.js';

describe('HttpAbstractStrategy', () => {
  it('should be defined', () => {
    expect(HttpAbstractStrategy).toBeDefined();
  });
});
