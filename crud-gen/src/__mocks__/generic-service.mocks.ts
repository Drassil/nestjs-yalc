import { BaseEntity } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { CrudGenRepository } from '@nestjs-yalc/crud-gen/crud-gen.repository.js';
import { ModelField, CrudGenObject } from '../object.decorator.js';
import { JsonTransformer } from '../transformers.helpers.js';

@CrudGenObject({})
export class ReadEntity {
  @ModelField({
    dst: {
      name: 'jsonProperty',
      transformer: JsonTransformer('data', 'sub.jsonProperty'),
    },
  })
  jsonProperty: string;

  @ModelField({})
  noTransform: string;

  // should never happen
  @ModelField({ dst: undefined })
  noDest: string;
}

export class WriteEntity {
  data: string;
}

export class MockedEntity extends BaseEntity {}

export const baseEntityRepository =
  createMock<CrudGenRepository<MockedEntity>>();
