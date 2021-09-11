import { FilterType, GeneralFilters, Operators } from '../ag-grid.enum';
import {
  DateFilterModel,
  FilterModel,
  ISimpleFilterModel,
  ITextFilterModel,
  NumberFilterModel,
  ICombinedSimpleModel,
  FilterInput,
} from '../ag-grid.interface';

const simpleFilterModel: ISimpleFilterModel = {
  filterType: FilterType.TEXT,
  type: GeneralFilters.EQUALS,
};
describe('Assets input dto test', () => {
  it('Check ISimpleFilterModel ', async () => {
    const testData: ISimpleFilterModel = simpleFilterModel;
    expect(testData).toBeDefined();
  });
  it('Check DateFilterModel', async () => {
    const testData: DateFilterModel = {
      filterType: FilterType.DATE,
      type: GeneralFilters.EQUALS,
    };
    expect(testData).toBeDefined();
  });
  it('Check ITextFilterModel', async () => {
    const testData: ITextFilterModel = {
      filterType: FilterType.TEXT,
      type: GeneralFilters.EQUALS,
    };
    expect(testData).toBeDefined();
  });
  it('Check FilterModel', async () => {
    const testData: FilterModel = {
      filterType: FilterType.TEXT,
      type: GeneralFilters.EQUALS,
    };
    expect(testData).toBeDefined();
  });
  it('Check NumberFilterModel', async () => {
    const testData: NumberFilterModel = {
      filterType: FilterType.NUMBER,
      type: GeneralFilters.EQUALS,
    };
    expect(testData).toBeDefined();
  });
  it('Check ICombinedSimpleModel', async () => {
    const testData: ICombinedSimpleModel = {
      filterType: FilterType.NUMBER,
      operator: Operators.AND,
      condition1: simpleFilterModel,
      condition2: simpleFilterModel,
    };
    expect(testData).toBeDefined();
  });
  it('Check FilterInput', async () => {
    const testData: FilterInput = {
      filterModel: simpleFilterModel,
    };
    expect(testData).toBeDefined();
  });
});
