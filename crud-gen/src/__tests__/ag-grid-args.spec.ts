import { BaseEntity } from 'typeorm';
import {
  agQueryParamsFactory,
  agQueryParamsNoPaginationFactory,
  IAgQueryParams,
} from '../ag-grid.args';
import { RowDefaultValues, SortDirection } from '../ag-grid.enum';

class TestEntity extends BaseEntity {
  columnId: number;
}

describe('Ag-grid args', () => {
  it('Should generate agQuery params', async () => {
    const agGridArgs = agQueryParamsFactory({
      sorting: [{ colId: 'somecol', sort: SortDirection.ASC }],
      filters: {},
    });
    expect(agGridArgs).toBeDefined();
    const instance = new agGridArgs();
    expect(instance).toBeDefined();
  });

  it('Should generate agQuery params without sorting', async () => {
    const agGridArgs = agQueryParamsFactory();
    expect(agGridArgs).toBeDefined();
    const instance = new agGridArgs();
    expect(instance.filters).not.toBeDefined();
  });

  it('Should generate agQuery params with with default values on startRow and endRow', async () => {
    const agGridArgs = agQueryParamsFactory(undefined, TestEntity);
    expect(agGridArgs).toBeDefined();
    const instance = new agGridArgs();
    expect(instance.startRow).toBe(RowDefaultValues.START_ROW);
    expect(instance.endRow).toBe(RowDefaultValues.END_ROW);
  });

  it('Should generate agQuery params with with custom values on startRow and endRow', async () => {
    const defaultValues: IAgQueryParams = {
      startRow: 0,
      endRow: 20,
    };
    const agGridArgs = agQueryParamsFactory(defaultValues, TestEntity);
    expect(agGridArgs).toBeDefined();
    const instance = new agGridArgs();
    expect(instance.startRow).toBe(defaultValues.startRow);
    expect(instance.endRow).toBe(defaultValues.endRow);
  });

  it('Should generate agQuery params without pagination', async () => {
    const agGridArgs = agQueryParamsNoPaginationFactory(
      {
        sorting: [{ colId: 'somecol', sort: SortDirection.ASC }],
        filters: {},
      },
      TestEntity,
    );
    expect(agGridArgs).toBeDefined();
    const instance = new agGridArgs();
    expect(instance).toBeDefined();
  });

  it('Should generate agQuery params without pagination and sorting', async () => {
    const agGridArgs = agQueryParamsNoPaginationFactory();
    expect(agGridArgs).toBeDefined();
    const instance = new agGridArgs();
    expect(instance).toBeDefined();
  });
});
