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
import { StringFormatEnum } from '../string-format.enum.js';

describe('Shared enum test', () => {
  it('Gender enum definition', async () => {
    expect(StringFormatEnum).toBeDefined();
  });
});
