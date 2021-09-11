import {
  agQueryParamsFactory,
  agQueryParamsNoPaginationFactory,
} from '../ag-grid.args';
import { SortDirection } from '../ag-grid.enum';

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

  it('Should generate agQuery params without pagination', async () => {
    const agGridArgs = agQueryParamsNoPaginationFactory({
      sorting: [{ colId: 'somecol', sort: SortDirection.ASC }],
      filters: {},
    });
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
