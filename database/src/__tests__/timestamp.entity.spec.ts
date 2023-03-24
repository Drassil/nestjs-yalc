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

import { BaseEntity } from 'typeorm';
import { EntityWithTimestamps } from '../timestamp.entity.js';

describe('EntityWithTimestamps entity test', () => {
  it('should be defined', () => {
    const result = EntityWithTimestamps(BaseEntity);

    expect(result).toBeDefined();
  });

  it('should be defined without base class', () => {
    const result = EntityWithTimestamps();

    expect(result).toBeDefined();
  });
});
