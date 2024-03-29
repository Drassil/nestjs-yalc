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
import { JsonEntityMixin } from '../json.entity.js';
import { ExtendedBaseEntity } from '@nestjs-yalc/jest/extended-base-entity.entity.js';
import 'reflect-metadata';

describe('JsonEntityMixin entity test', () => {
  const ClassJsonEntityMixin = JsonEntityMixin(ExtendedBaseEntity);

  it('should be defined', () => {
    expect(ClassJsonEntityMixin).toBeDefined();
  });

  it('updateData should work as intended', () => {
    const testEntityPvt = new ClassJsonEntityMixin();
    jest
      .spyOn(Reflect, 'getMetadata')
      .mockReturnValueOnce({ first: true, second: false });
    testEntityPvt.updateData();
  });

  it('updateData should work with a Json field', () => {
    const testEntityPvt = new ClassJsonEntityMixin();
    jest
      .spyOn(Reflect, 'getMetadata')
      .mockReturnValueOnce({ first: true, second: false, third: true });
    testEntityPvt.updateData();
    expect(testEntityPvt.third()).toContain('JSON_MERGE_PATCH');
  });
});
