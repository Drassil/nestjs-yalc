import { BaseEntity } from 'typeorm';
import {
  agQueryParamsFactory,
  agQueryParamsNoPaginationFactory,
  IAgQueryParams,
} from '../crud-gen.args';
import { RowDefaultValues, SortDirection } from '../crud-gen.enum';

class TestEntity extends BaseEntity {
  columnId: number;
}

describe('Crud-gen args', () => {
  it('Should generate agQuery params', async () => {
    const crudGenArgs = agQueryParamsFactory({
      sorting: [{ colId: 'somecol', sort: SortDirection.ASC }],
      filters: {},
    });
    expect(crudGenArgs).toBeDefined();
    const instance = new crudGenArgs();
    expect(instance).toBeDefined();
  });

  it('Should generate agQuery params without sorting', async () => {
    const crudGenArgs = agQueryParamsFactory();
    expect(crudGenArgs).toBeDefined();
    const instance = new crudGenArgs();
    expect(instance.filters).not.toBeDefined();
  });

  it('Should generate agQuery params with with default values on startRow and endRow', async () => {
    const crudGenArgs = agQueryParamsFactory(undefined, TestEntity);
    expect(crudGenArgs).toBeDefined();
    const instance = new crudGenArgs();
    expect(instance.startRow).toBe(RowDefaultValues.START_ROW);
    expect(instance.endRow).toBe(RowDefaultValues.END_ROW);
  });

  it('Should generate agQuery params with with custom values on startRow and endRow', async () => {
    const defaultValues: IAgQueryParams = {
      startRow: 0,
      endRow: 20,
    };
    const crudGenArgs = agQueryParamsFactory(defaultValues, TestEntity);
    expect(crudGenArgs).toBeDefined();
    const instance = new crudGenArgs();
    expect(instance.startRow).toBe(defaultValues.startRow);
    expect(instance.endRow).toBe(defaultValues.endRow);
  });

  it('Should generate agQuery params without pagination', async () => {
    const crudGenArgs = agQueryParamsNoPaginationFactory(
      {
        sorting: [{ colId: 'somecol', sort: SortDirection.ASC }],
        filters: {},
      },
      TestEntity,
    );
    expect(crudGenArgs).toBeDefined();
    const instance = new crudGenArgs();
    expect(instance).toBeDefined();
  });

  it('Should generate agQuery params without pagination and sorting', async () => {
    const crudGenArgs = agQueryParamsNoPaginationFactory();
    expect(crudGenArgs).toBeDefined();
    const instance = new crudGenArgs();
    expect(instance).toBeDefined();
  });
});
