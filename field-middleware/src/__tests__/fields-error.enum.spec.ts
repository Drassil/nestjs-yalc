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
import { FieldErrorsEnum } from '../fields-error.enum.js';

describe('Shared enum test', () => {
  it('Gender enum definition', async () => {
    expect(FieldErrorsEnum).toBeDefined();
  });
});
