import { BaseEntity } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { CrudGenRepository } from '@nestjs-yalc/crud-gen/crud-gen.repository';
import { CrudGenField, CrudGenObject } from '../object.decorator';
import { JsonTransformer } from '../transformers.helpers';

@CrudGenObject({})
export class ReadEntity {
  @CrudGenField({
    dst: {
      name: 'jsonProperty',
      transformer: JsonTransformer('data', 'sub.jsonProperty'),
    },
  })
  jsonProperty: string;

  @CrudGenField({})
  noTransform: string;

  // should never happen
  @CrudGenField({ dst: undefined })
  noDest: string;
}

export class WriteEntity {
  data: string;
}

export class MockedEntity extends BaseEntity {}

export const baseEntityRepository = createMock<
  CrudGenRepository<MockedEntity>
>();
