import { BaseEntity } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { CGExtendedRepository } from '@nestjs-yalc/crud-gen/crud-gen.repository.js';
import { ModelField, ModelObject } from '../object.decorator.js';
import { JsonTransformer } from '../transformers.helpers.js';

@ModelObject({})
export class ReadEntity {
  @ModelField({
    dst: {
      name: 'jsonProperty',
      transformerDst: JsonTransformer('data', 'sub.jsonProperty'),
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
  createMock<CGExtendedRepository<MockedEntity>>();
