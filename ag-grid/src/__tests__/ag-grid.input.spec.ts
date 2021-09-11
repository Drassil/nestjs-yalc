import { RowGroup, SortModel } from '../ag-grid.input';

describe('Dynamic user input dto test', () => {
  it('Check RowGroup Dto', async () => {
    const testData = new RowGroup();

    expect(testData).toBeDefined();
  });
  it('Check SortModel Dto', async () => {
    const testData = new SortModel();

    expect(testData).toBeDefined();
  });
});
