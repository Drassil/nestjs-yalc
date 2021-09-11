jest.mock('@nestjs/graphql');
jest.mock('../ag-grid.args', () => ({
  agQueryParamsFactory: jest.fn(),
  agQueryParamsNoPaginationFactory: jest.fn(),
}));

import * as agGridArgsDecorator from '../ag-grid-args.decorator';
import {
  Equal,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Like,
  Between,
  In,
} from 'typeorm';
import {
  FilterOption,
  FilterOptionType,
  IFieldMapper,
} from '@nestjs-yalc/interfaces/maps.interface';
import { IAgQueryParams } from '../ag-grid.args';
import {
  CustomWhereKeys,
  FilterType,
  GeneralFilters,
  Operators,
  SortDirection,
} from '../ag-grid.enum';
import { GqlExecutionContext } from '@nestjs/graphql';
import {
  mockedExecutionContext,
  mockedNestGraphql,
} from '@nestjs-yalc/jest/common-mocks.helper';
import {
  DateFilterModel,
  FilterInput,
  ICombinedSimpleModel,
  IMultiColumnJoinOptions,
  ISetFilterModel,
  ISimpleFilterModel,
  ITextFilterModel,
  NumberFilterModel,
} from '../ag-grid.interface';
import * as graphql from '@nestjs/graphql';
import {
  AgGridFilterNotSupportedError,
  AgGridFilterProhibited,
  AgGridInvalidArgumentError,
  AgGridInvalidOperatorError,
  AgGridInvalidPropertyError,
  AgGridConditionNotSupportedError,
} from '../ag-grid.error';
import { DateHelper } from '@nestjs-yalc/utils/date.helper';
import { IWhereCondition } from '../ag-grid.type';
import { IAgGridArgsOptions } from '../ag-grid-args.decorator';
import { GraphQLResolveInfo } from 'graphql';
import { createMock } from '@golevelup/ts-jest';

const firstTextParameter = 'a';
const firstNumberParameter = 1;
const secondNumberParameter = 2;
const newDate = new Date();
const firstDateParameter = newDate.toDateString();
const secondDateParameter = newDate.toDateString();
const firstDateParameterPlus1Day = new Date(
  newDate.getDate() + 1,
).toDateString();
const inDateResults = [
  {
    from: DateHelper.dateToSQLDateTime(
      new Date(new Date(firstDateParameter).setHours(0, 0, 0, 0)),
    ),
    to: DateHelper.dateToSQLDateTime(
      new Date(new Date(firstDateParameter).setHours(23, 59, 59, 999)),
    ),
  },
  {
    from: DateHelper.dateToSQLDateTime(
      new Date(new Date(firstDateParameter).setHours(0, 0, 0, 0)),
    ),
    to: DateHelper.dateToSQLDateTime(
      new Date(new Date(firstDateParameterPlus1Day).setHours(23, 59, 59, 999)),
    ),
  },
];
const switchCaseTextTests = [
  {
    filter: 'equals',
    result: Equal(firstTextParameter),
  },
  {
    filter: 'equal',
    result: Equal(firstTextParameter),
  },
  {
    filter: 'StartsWith',
    result: Like(`${firstTextParameter}%`),
  },
  {
    filter: 'EndsWith',
    result: Like(`%${firstTextParameter}`),
  },
  {
    filter: 'Contains',
    result: Like(`%${firstTextParameter}%`),
  },
];
const switchCaseNumberTests = [
  {
    filter: 'equals',
    result: Equal(firstNumberParameter),
  },
  {
    filter: 'equal',
    result: Equal(firstNumberParameter),
  },
  {
    filter: 'lessthan',
    result: LessThan(firstNumberParameter),
  },
  {
    filter: 'LessThanOrEqual',
    result: LessThanOrEqual(firstNumberParameter),
  },
  {
    filter: 'greaterThan',
    result: MoreThan(firstNumberParameter),
  },
  {
    filter: 'greaterThanOrEqual',
    result: MoreThanOrEqual(firstNumberParameter),
  },
  {
    filter: 'inRange',
    result: Between(firstNumberParameter, secondNumberParameter),
  },
];
const switchCaseDateTests = [
  {
    filter: 'equals',
    result: Equal(firstDateParameter),
  },
  {
    filter: 'equal',
    result: Equal(firstDateParameter),
  },
  {
    filter: 'lessthan',
    result: LessThan(firstDateParameter),
  },
  {
    filter: 'greaterThan',
    result: MoreThan(firstDateParameter),
  },
  {
    filter: 'inRange',
    result: Between(firstDateParameter, secondDateParameter),
  },
  {
    filter: 'inDate',
    result: Between(inDateResults[0].from, inDateResults[0].to),
  },
];

const fixedKey = 'passed';
const dbName = 'original';

const infoObj = {
  fieldNodes: [
    {
      selectionSet: {
        selections: [
          {
            name: {
              value: 'first',
            },
          },
          {
            name: {
              value: 'second',
            },
          },
          {
            name: {
              value: fixedKey,
            },
          },
          {
            name: {
              value: dbName,
            },
          },
        ],
      },
    },
  ],
};

interface IFieldMapperTest {
  data: IFieldMapper;
  result: string;
}
const columnConversionTests: IFieldMapperTest[] = [
  {
    data: { [fixedKey]: { dst: dbName, isRequired: true } },
    result: dbName,
  },
  {
    data: { [fixedKey]: { dst: '', isRequired: true } },
    result: fixedKey,
  },
  {
    data: {
      [`not${fixedKey}`]: { dst: dbName, isRequired: true },
    },
    result: fixedKey,
  },
];

const fixedIFieldMapper: IFieldMapper<any> = {
  ...columnConversionTests[0].data,
  [`second_${fixedKey}`]: {
    dst: `second_${dbName}`,
    isRequired: true,
  },
  [`third_${fixedKey}`]: {
    dst: `third_${dbName}`,
    isSymbolic: true,
  },
};

const fixedData: IAgGridArgsOptions = {
  fieldMap: fixedIFieldMapper,
};

const fixedDataWithDefault: IAgGridArgsOptions = {
  fieldMap: fixedIFieldMapper,
  defaultValue: {
    sorting: [
      {
        colId: '',
        sort: SortDirection.ASC,
      },
    ],
    startRow: 5,
  },
};

const fixedIncludefilterOption: FilterOption = {
  type: FilterOptionType.INCLUDE,
  fields: [dbName, `second_${dbName}`, `third_${dbName}`],
};

const fixedExcludefilterOption: FilterOption = {
  type: FilterOptionType.EXCLUDE,
  fields: [`excluded_${dbName}`],
};

const fixedDataFilterToInclude: IAgGridArgsOptions = {
  fieldMap: {
    field: fixedIFieldMapper,
    filterOption: fixedIncludefilterOption,
  },
};

const fixedDataFilter = {
  [fixedKey]: {
    filterType: FilterType.DATE,
    type: GeneralFilters.CONTAINS,
    filter: '_',
  },
};

const fixedFilterNotContains = {
  [fixedKey]: {
    filterType: FilterType.TEXT,
    type: GeneralFilters.NOT_CONTAINS,
    filter: '_',
  },
};

const fixedSimpleBadFilter: ISimpleFilterModel = {
  filterType: 'wrong' as any,
  type: GeneralFilters.CONTAINS,
  filter: '_',
};

const fixedSimpleTextFilter: ITextFilterModel = {
  filterType: FilterType.TEXT,
  type: GeneralFilters.CONTAINS,
  filter: '_',
};

const fixedFilterInputText = {
  [fixedKey]: fixedSimpleTextFilter,
};

const fixedUndefinedTextFilter: ITextFilterModel = {
  filterType: FilterType.TEXT,
  type: GeneralFilters.CONTAINS,
  filter: undefined,
};

const fixedCombinedOrTextFilter: ICombinedSimpleModel = {
  filterType: FilterType.TEXT,
  operator: Operators.OR,
  condition1: fixedSimpleTextFilter,
  condition2: fixedSimpleTextFilter,
};

const fixedCombinedAndTextFilter: ICombinedSimpleModel = {
  filterType: FilterType.TEXT,
  operator: Operators.AND,
  condition1: fixedSimpleTextFilter,
  condition2: fixedSimpleTextFilter,
};

const fixedCombinedInvalidArgsTextFilter: ICombinedSimpleModel = {
  filterType: FilterType.TEXT,
  operator: Operators.OR,
  condition1: undefined,
  condition2: undefined,
};

const fixedCombinedInvalidOperatorTextFilter = {
  filterType: FilterType.TEXT,
  operator: 'invalid',
  condition1: fixedSimpleTextFilter,
  condition2: fixedSimpleTextFilter,
};

const fixedSimpleNumberFilter: NumberFilterModel = {
  filterType: FilterType.NUMBER,
  type: GeneralFilters.LESS_THAN,
  filter: 0,
};

const fixedSetFilter: ISetFilterModel = {
  filterType: FilterType.SET,
  values: [1, 2],
};

const fixedFilterInputNumber = {
  [fixedKey]: fixedSimpleNumberFilter,
};

const fixedCombinedOrNumberFilter: ICombinedSimpleModel = {
  filterType: FilterType.NUMBER,
  operator: Operators.OR,
  condition1: fixedSimpleNumberFilter,
  condition2: fixedSimpleNumberFilter,
};

const fixedSimpleDateFilter: DateFilterModel = {
  filterType: FilterType.DATE,
  type: GeneralFilters.LESS_THAN,
  dateFrom: '2020',
};

const fixedFilterInputDate = {
  [fixedKey]: fixedSimpleDateFilter,
};

const fixedCombinedOrDateFilter: ICombinedSimpleModel = {
  filterType: FilterType.DATE,
  operator: Operators.OR,
  condition1: fixedSimpleDateFilter,
  condition2: fixedSimpleDateFilter,
};

const fixedMulticolumnJoinOptionsAndObject: IMultiColumnJoinOptions = {
  multiColumnJoinOperator: Operators.AND,
  [fixedKey]: fixedSimpleTextFilter,
  [`second_${fixedKey}`]: fixedCombinedOrTextFilter,
};

const fixedMulticolumnJoinOptionsAndOrObject: IMultiColumnJoinOptions = {
  multiColumnJoinOperator: Operators.AND,
  [fixedKey]: fixedSimpleTextFilter,
  [`second_${fixedKey}`]: fixedSimpleTextFilter,
  multiColumnJoinOptions: {
    multiColumnJoinOperator: Operators.OR,
    [`third_${fixedKey}`]: fixedSimpleTextFilter,
    [`second_${fixedKey}`]: fixedSimpleNumberFilter,
  },
};

const fixedMulticolumnJoinOptionsAndOrAndOrAndOrObject: IMultiColumnJoinOptions = {
  multiColumnJoinOperator: Operators.AND,
  [fixedKey]: fixedSimpleTextFilter,
  [`second_${fixedKey}`]: fixedSimpleTextFilter,
  multiColumnJoinOptions: {
    multiColumnJoinOperator: Operators.OR,
    [`third_${fixedKey}`]: fixedSimpleTextFilter,
    [`second_${fixedKey}`]: fixedSimpleNumberFilter,
    multiColumnJoinOptions: {
      multiColumnJoinOperator: Operators.AND,
      [fixedKey]: fixedSimpleTextFilter,
      [`second_${fixedKey}`]: fixedSimpleTextFilter,
      multiColumnJoinOptions: {
        multiColumnJoinOperator: Operators.OR,
        [`third_${fixedKey}`]: fixedSimpleTextFilter,
        [`second_${fixedKey}`]: fixedSimpleNumberFilter,
        multiColumnJoinOptions: {
          multiColumnJoinOperator: Operators.AND,
          [`third_${fixedKey}`]: fixedCombinedOrTextFilter,
          [`second_${fixedKey}`]: fixedCombinedOrNumberFilter,
          multiColumnJoinOptions: {
            multiColumnJoinOperator: Operators.OR,
            [`third_${fixedKey}`]: fixedCombinedOrTextFilter,
            [`second_${fixedKey}`]: fixedCombinedOrNumberFilter,
          },
        },
      },
    },
  },
};

const fixedWhereAndObject: FilterInput = {
  multiColumnJoinOptions: { ...fixedMulticolumnJoinOptionsAndObject },
};

const fixedWhereMulticolumnObject: FilterInput = {
  multiColumnJoinOptions: { ...fixedMulticolumnJoinOptionsAndOrObject },
};

const fixedWhereMulticolumnAndFiltersObject: FilterInput = {
  [fixedKey]: fixedCombinedOrTextFilter,
  multiColumnJoinOptions: { ...fixedMulticolumnJoinOptionsAndOrObject },
};

const fixedLongWhereMulticolumnAndFiltersObject: FilterInput = {
  [fixedKey]: fixedCombinedOrTextFilter,
  multiColumnJoinOptions: {
    ...fixedMulticolumnJoinOptionsAndOrAndOrAndOrObject,
  },
};

const fixedArgsNoFilters: IAgQueryParams = {
  startRow: 0,
  endRow: 0,
  sorting: [
    {
      colId: '',
      sort: SortDirection.ASC,
    },
  ],
  /*rowGroups: [
    {
      colId: '',
      aggFunc: '',
    },
  ],
  groupKeys: [''],*/
  filters: null,
};

const fixedArgs: IAgQueryParams = {
  ...fixedArgsNoFilters,
  filters: { ...fixedFilterInputText },
};

const fixeNumberArgs: IAgQueryParams = {
  ...fixedArgsNoFilters,
  filters: { ...fixedFilterInputNumber },
};

const fixeDatedArgs: IAgQueryParams = {
  ...fixedArgsNoFilters,
  filters: { ...fixedFilterInputDate },
};

const fixedBadArgs: IAgQueryParams = {
  ...fixedArgs,
  filters: { ...fixedDataFilter },
};

const fixedBadFilter: IAgQueryParams = {
  ...fixedArgs,
  filters: { [fixedKey]: fixedSimpleBadFilter },
};

const fixedArgsNOTFilter: IAgQueryParams = {
  ...fixedArgs,
  filters: { ...fixedFilterNotContains },
};

const mockedInfo = createMock<GraphQLResolveInfo>();

const fixedWhereTransformed: IWhereCondition = {
  filters: { [dbName]: Equal('') },
  [CustomWhereKeys.MULTICOLUMNJOINOPTIONS]: {
    operator: Operators.AND,
    filters: { [`table.${dbName}`]: Equal('') },
  },
};

const fixedWhereTransformedWithNotInclude: IWhereCondition = {
  filters: { [dbName]: Equal(''), exluded: Equal('') },
  [CustomWhereKeys.MULTICOLUMNJOINOPTIONS]: {
    operator: Operators.AND,
    filters: { [`table.${dbName}`]: Equal('') },
  },
};

const fixedWhereTransformedWithExcluded: IWhereCondition = {
  filters: { [dbName]: Equal(''), [`excluded_${dbName}`]: Equal('') },
  [CustomWhereKeys.MULTICOLUMNJOINOPTIONS]: {
    operator: Operators.AND,
    filters: { [`table.${dbName}`]: Equal('') },
  },
};

const fixedWhereTransformedNested: IWhereCondition = {
  filters: { [dbName]: Equal('') },
  [CustomWhereKeys.MULTICOLUMNJOINOPTIONS]: {
    operator: Operators.AND,
    filters: { [`table.${dbName}`]: Equal('') },
    [CustomWhereKeys.MULTICOLUMNJOINOPTIONS]: {
      operator: Operators.AND,
      filters: { [`table.${dbName}`]: Equal('') },
    },
  },
};
//mockedGqlExecutionContext.getArgs.mockReturnValue(fixedArgs);
const mockCreate = (mockedNestGraphql.GqlExecutionContext.create = jest.fn());
mockCreate.mockImplementation(() => ({
  getArgs: jest.fn().mockReturnValue(fixedArgs),
  getInfo: jest.fn().mockReturnValue(infoObj),
}));
const mockedGqlExecutionContext = GqlExecutionContext.create(
  mockedExecutionContext,
);

describe('Ag-grid args decorator', () => {
  it('Check getTextFilter functionality', async () => {
    let testgetTextFilter;
    for (const test of switchCaseTextTests) {
      testgetTextFilter = agGridArgsDecorator.getTextFilter(
        test.filter,
        firstTextParameter,
      );
      expect(testgetTextFilter).toBeDefined();
      expect(testgetTextFilter).toEqual(test.result);
    }
  });

  it('Check getNumberFilter functionality', async () => {
    let testgetTextFilter;
    for (const test of switchCaseNumberTests) {
      testgetTextFilter = agGridArgsDecorator.getNumberFilter(
        test.filter,
        firstNumberParameter,
        secondNumberParameter,
      );
      expect(testgetTextFilter).toBeDefined();
      expect(testgetTextFilter).toEqual(test.result);
    }
  });

  it('Check getDateFilter functionality', async () => {
    let testgetTextFilter;
    for (const test of switchCaseDateTests) {
      testgetTextFilter = agGridArgsDecorator.getDateFilter(
        test.filter,
        firstDateParameter,
        secondDateParameter,
      );
      expect(testgetTextFilter).toBeDefined();
      expect(testgetTextFilter).toEqual(test.result);
    }
  });

  it('Check inDate filter functionality', async () => {
    const testGetStringFilter = agGridArgsDecorator.getDateFilter(
      GeneralFilters.IN_DATE,
      firstDateParameter,
      firstDateParameterPlus1Day,
    );
    expect(testGetStringFilter).toBeDefined();
    expect(testGetStringFilter).toEqual(
      Between(inDateResults[1].from, inDateResults[1].to),
    );
  });

  it('Check inDate filter functionality whith only 1 date', async () => {
    const testGetStringFilter = agGridArgsDecorator.getDateFilter(
      GeneralFilters.IN_DATE,
      firstDateParameter,
    );
    expect(testGetStringFilter).toBeDefined();
    expect(testGetStringFilter).toEqual(
      Between(inDateResults[0].from, inDateResults[0].to),
    );
  });

  it('Check get filters errors', async () => {
    expect(() =>
      agGridArgsDecorator.getTextFilter('ImAnError', firstTextParameter),
    ).toThrowError(new AgGridFilterNotSupportedError());
    expect(() =>
      agGridArgsDecorator.getNumberFilter('ImAnError', firstNumberParameter),
    ).toThrowError(new AgGridFilterNotSupportedError());
    expect(() =>
      agGridArgsDecorator.getDateFilter('ImAnError', firstDateParameter),
    ).toThrowError(new AgGridFilterNotSupportedError());
  });

  it('Check AgGridArgsFactory functionality', async () => {
    const testData = agGridArgsDecorator.AgGridArgsFactory(
      fixedData,
      mockedExecutionContext,
    );

    expect(testData).toBeDefined();
  });

  it('Check mapAgGridParams functionality on text filter', async () => {
    const testData = agGridArgsDecorator.mapAgGridParams(
      fixedData,
      mockedGqlExecutionContext,
      fixedArgs,
      mockedInfo,
    );

    expect(testData).toBeDefined();
  });

  it('Check mapAgGridParams functionality on number filter', async () => {
    const testData = agGridArgsDecorator.mapAgGridParams(
      fixedData,
      mockedGqlExecutionContext,
      fixeNumberArgs,
      mockedInfo,
    );

    expect(testData).toBeDefined();
  });

  it('Check mapAgGridParams functionality on data filter', async () => {
    const testData = agGridArgsDecorator.mapAgGridParams(
      fixedData,
      mockedGqlExecutionContext,
      fixeDatedArgs,
      mockedInfo,
    );

    expect(testData).toBeDefined();
  });

  it('Check mapAgGridParams functionality on bad filter', async () => {
    try {
      agGridArgsDecorator.mapAgGridParams(
        fixedData,
        mockedGqlExecutionContext,
        fixedBadFilter,
        mockedInfo,
      );
    } catch (error) {
      expect(error).toEqual(new AgGridFilterNotSupportedError());
    }
  });

  it('Check mapAgGridParams functionality with no filters', async () => {
    const testData = agGridArgsDecorator.mapAgGridParams(
      fixedData,
      mockedGqlExecutionContext,
      fixedArgsNoFilters,
      mockedInfo,
    );

    expect(testData).toBeDefined();
  });

  it('Check mapAgGridParams with an invalid argument', async () => {
    expect(() =>
      agGridArgsDecorator.mapAgGridParams(
        fixedData,
        mockedGqlExecutionContext,
        fixedBadArgs,
        mockedInfo,
      ),
    ).toThrowError(new AgGridInvalidArgumentError());
  });

  it('Check filters not functionality', async () => {
    const testData = agGridArgsDecorator.mapAgGridParams(
      fixedData,
      mockedGqlExecutionContext,
      fixedArgsNOTFilter,
      mockedInfo,
    );

    expect(testData).toBeDefined();
  });

  it('Check filters with undefined data', async () => {
    const testData = agGridArgsDecorator.mapAgGridParams(
      undefined,
      mockedGqlExecutionContext,
      fixedArgsNOTFilter,
      mockedInfo,
    );

    expect(testData).toBeDefined();
  });

  it('Check mapAgGridParams functionality with filterMapper', async () => {
    const testData = agGridArgsDecorator.mapAgGridParams(
      fixedDataFilterToInclude,
      mockedGqlExecutionContext,
      fixedArgs,
      mockedInfo,
    );

    expect(testData).toBeDefined();
  });

  it('Check mapAgGridParams functionality with default values', async () => {
    const testData = agGridArgsDecorator.mapAgGridParams(
      fixedDataWithDefault,
      mockedGqlExecutionContext,
      { filters: {}, startRow: undefined, endRow: 5 },
      mockedInfo,
    );

    expect(testData).toBeDefined();
  });

  it('Check mapAgGridParams functionality with no sorting', async () => {
    const testData = agGridArgsDecorator.mapAgGridParams(
      { ...fixedDataWithDefault, defaultValue: undefined },
      mockedGqlExecutionContext,
      { filters: {}, startRow: undefined, endRow: 5 },
      mockedInfo,
    );

    expect(testData).toBeDefined();
  });

  it('Check convertFilter with simple Filter', async () => {
    const testData = agGridArgsDecorator.convertFilter(fixedSimpleTextFilter);

    expect(testData).toBeDefined();
  });

  it('Check convertFilter with undefined Filter', async () => {
    try {
      agGridArgsDecorator.convertFilter(fixedUndefinedTextFilter);
    } catch (error) {
      expect(error).toEqual(new AgGridInvalidArgumentError());
    }
  });

  it('Check convertFilter with combined OR Filter', async () => {
    const testData = agGridArgsDecorator.convertFilter(
      fixedCombinedOrTextFilter,
    );

    expect(testData).toBeDefined();
  });

  it('Check convertFilter with combined AND Filter', async () => {
    try {
      agGridArgsDecorator.convertFilter(fixedCombinedAndTextFilter);
    } catch (error) {
      expect(error).toEqual(new AgGridConditionNotSupportedError());
    }
  });

  it('Check convertFilter with combined invalid args Filter', async () => {
    try {
      agGridArgsDecorator.convertFilter(fixedCombinedInvalidArgsTextFilter);
    } catch (error) {
      expect(error).toEqual(new AgGridInvalidArgumentError());
    }
  });

  it('Check convertFilter with combined invalid operator Filter', async () => {
    try {
      agGridArgsDecorator.convertFilter(
        <ICombinedSimpleModel>fixedCombinedInvalidOperatorTextFilter,
      );
    } catch (error) {
      expect(error).toEqual(new AgGridInvalidOperatorError());
    }
  });

  it('Check convertFilter with simple number Filter', async () => {
    const testData = agGridArgsDecorator.convertFilter(fixedSimpleNumberFilter);

    expect(testData).toBeDefined();
  });

  it('Check convertFilter with combined invalid args Filter', async () => {
    try {
      agGridArgsDecorator.convertFilter(fixedCombinedInvalidArgsTextFilter);
    } catch (error) {
      expect(error).toEqual(new AgGridInvalidArgumentError());
    }
  });

  it('Check convertFilter with combined invalid operator Filter', async () => {
    try {
      agGridArgsDecorator.convertFilter(
        <ICombinedSimpleModel>fixedCombinedInvalidOperatorTextFilter,
      );
    } catch (error) {
      expect(error).toEqual(new AgGridInvalidOperatorError());
    }
  });

  it('Check convertFilter with simple number Filter', async () => {
    const testData = agGridArgsDecorator.convertFilter(fixedSimpleNumberFilter);

    expect(testData).toBeDefined();
  });

  it('Check convertFilter with simple date Filter', async () => {
    const testData = agGridArgsDecorator.convertFilter(fixedSimpleDateFilter);

    expect(testData).toBeDefined();
  });

  it('should check filterSwitch is working properly', async () => {
    // with SET
    let testData = agGridArgsDecorator.filterSwitch(fixedSetFilter);

    expect(testData).toStrictEqual(In(fixedSetFilter.values));

    // with TEXT
    testData = agGridArgsDecorator.filterSwitch(fixedSimpleTextFilter);

    expect(testData).toStrictEqual(Like(`%${fixedSimpleTextFilter.filter}%`));

    // with INVALID

    expect(() =>
      agGridArgsDecorator.filterSwitch(fixedSimpleBadFilter),
    ).toThrow(AgGridFilterNotSupportedError);
  });

  it('should check isCombinedWhereModel is working properly', async () => {
    let testData = agGridArgsDecorator.isCombinedWhereModel({});

    expect(testData).toBeFalsy();

    testData = agGridArgsDecorator.isCombinedWhereModel({
      operator: Operators.AND,
      filter_1: {},
      filter_2: {},
    } as any);

    expect(testData).toBeTruthy();
  });

  it('should check isFindOperator is working properly', async () => {
    let testData = agGridArgsDecorator.isFindOperator({});

    expect(testData).toBeFalsy();

    testData = agGridArgsDecorator.isFindOperator({
      type: FilterType.TEXT,
      value: {},
    } as any);

    expect(testData).toBeTruthy();

    testData = agGridArgsDecorator.isFindOperator({
      type: FilterType.TEXT,
      child: {},
    } as any);

    expect(testData).toBeTruthy();
  });

  it('isFilterModel should return false with undefined input', async () => {
    const testData = agGridArgsDecorator.isFilterModel(undefined);

    expect(testData).toEqual(false);
  });
  it('Check isTextFilterModel simple case', async () => {
    const testData = agGridArgsDecorator.isTextFilterModel(
      fixedSimpleTextFilter,
    );

    expect(testData).toEqual(true);
  });

  it('Check isTextFilterModel combined case', async () => {
    const testData = agGridArgsDecorator.isTextFilterModel(
      fixedCombinedOrTextFilter,
    );

    expect(testData).toEqual(true);
  });

  it('Check isTextFilterModel simple case false', async () => {
    const testData = agGridArgsDecorator.isTextFilterModel(
      fixedSimpleNumberFilter,
    );

    expect(testData).toEqual(false);
  });

  it('Check isTextFilterModel combined case false', async () => {
    const testData = agGridArgsDecorator.isTextFilterModel(
      fixedCombinedOrNumberFilter,
    );

    expect(testData).toEqual(false);
  });

  it('Check isNumberFilterModel simple case', async () => {
    const testData = agGridArgsDecorator.isNumberFilterModel(
      fixedSimpleNumberFilter,
    );

    expect(testData).toEqual(true);
  });

  it('Check isNumberFilterModel combined case', async () => {
    const testData = agGridArgsDecorator.isNumberFilterModel(
      fixedCombinedOrNumberFilter,
    );

    expect(testData).toEqual(true);
  });

  it('Check isNumberFilterModel simple case false', async () => {
    const testData = agGridArgsDecorator.isNumberFilterModel(
      fixedSimpleDateFilter,
    );

    expect(testData).toEqual(false);
  });

  it('Check isNumberFilterModel combined case false', async () => {
    const testData = agGridArgsDecorator.isNumberFilterModel(
      fixedCombinedOrDateFilter,
    );

    expect(testData).toEqual(false);
  });

  it('Check isDateFilterModel simple case', async () => {
    const testData = agGridArgsDecorator.isDateFilterModel(
      fixedSimpleDateFilter,
    );

    expect(testData).toEqual(true);
  });

  it('Check isDateFilterModel combined case', async () => {
    const testData = agGridArgsDecorator.isDateFilterModel(
      fixedCombinedOrDateFilter,
    );

    expect(testData).toEqual(true);
  });

  it('Check isDateFilterModel simple case false', async () => {
    const testData = agGridArgsDecorator.isDateFilterModel(
      fixedSimpleTextFilter,
    );

    expect(testData).toEqual(false);
  });

  it('Check isDateFilterModel combined case false', async () => {
    const testData = agGridArgsDecorator.isDateFilterModel(
      fixedCombinedOrTextFilter,
    );

    expect(testData).toEqual(false);
  });

  it('should return false because of missing filters', async () => {
    const isDate = agGridArgsDecorator.isDateFilterModel(null);
    const isText = agGridArgsDecorator.isTextFilterModel(null);
    const isNumber = agGridArgsDecorator.isNumberFilterModel(null);

    expect(isDate).toBeFalsy();
    expect(isText).toBeFalsy();
    expect(isNumber).toBeFalsy();
  });

  it('Check isIFieldAndFilterMapper with IFieldMapper', async () => {
    const testData = agGridArgsDecorator.isIFieldAndFilterMapper(
      fixedIFieldMapper,
    );

    expect(testData).toEqual(false);
  });

  it('Check isIFieldAndFilterMapper with undefined', async () => {
    const testData = agGridArgsDecorator.isIFieldAndFilterMapper(undefined);

    expect(testData).toEqual(false);
  });

  it('Check isIFieldAndFilterMapper with IFieldAndFilterMapper', async () => {
    const testData = agGridArgsDecorator.isIFieldAndFilterMapper({
      field: fixedIFieldMapper as IFieldMapper,
    });

    expect(testData).toEqual(true);
  });

  it('should not resolve multicolumn', async () => {
    const spy = jest.spyOn(
      agGridArgsDecorator,
      'resolveMultiColumnJoinOptions',
    );

    agGridArgsDecorator.resolveMultiColumnJoinOptions(
      fixedMulticolumnJoinOptionsAndObject,
      {},
    );

    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();
  });

  it('should throw not supported filter error on resolveMultiColumnJoinOptions', async () => {
    expect(() => {
      agGridArgsDecorator.resolveMultiColumnJoinOptions(
        {
          nothing: 'test',
        } as any,
        {},
      );
    }).toThrowError(AgGridFilterNotSupportedError);
  });

  it('should throw not supported filter error on createWhere', async () => {
    expect(() => {
      agGridArgsDecorator.createWhere(
        {
          nothing: 'test',
        } as any,
        {},
      );
    }).toThrowError(AgGridFilterNotSupportedError);
  });

  it('Check removeSymbolicSelection work', async () => {
    const testData = agGridArgsDecorator.removeSymbolicSelection(
      [`second_${fixedKey}`, `third_${fixedKey}`],
      fixedIFieldMapper,
    );

    expect(testData).toEqual([`second_${fixedKey}`]);
  });

  it('Check isMulticolumnJoinOptions', () => {
    let testData = agGridArgsDecorator.isMulticolumnJoinOptions(
      fixedMulticolumnJoinOptionsAndOrObject,
    );
    expect(testData).toEqual(true);

    testData = agGridArgsDecorator.isMulticolumnJoinOptions(
      fixedSimpleTextFilter,
    );
    expect(testData).toEqual(false);
  });

  it('Check isOperator', () => {
    let testData = agGridArgsDecorator.isOperator(
      fixedMulticolumnJoinOptionsAndOrObject.multiColumnJoinOperator,
    );
    expect(testData).toEqual(true);

    testData = agGridArgsDecorator.isMulticolumnJoinOptions(
      fixedSimpleTextFilter,
    );
    expect(testData).toEqual(false);
  });
  it('Check takeOnlyFilters', () => {
    const testData = agGridArgsDecorator.takeOnlyFilters(
      fixedMulticolumnJoinOptionsAndOrObject,
    );
    expect(testData).not.toEqual(fixedMulticolumnJoinOptionsAndOrObject);
    expect(testData).toEqual({
      [fixedKey]: fixedSimpleTextFilter,
      [`second_${fixedKey}`]: fixedSimpleTextFilter,
    });
  });

  it('Check takeOnlyFilters null value', () => {
    const testData = agGridArgsDecorator.takeOnlyFilters(null);
    expect(testData).toEqual({});
  });

  it('Check takeOnlyFilters property null value', () => {
    const testData = agGridArgsDecorator.takeOnlyFilters({ [fixedKey]: null });
    expect(testData).toEqual({});
  });

  it('Check getSelectedFilters', () => {
    const testData = agGridArgsDecorator.getSelectedFilters(
      fixedMulticolumnJoinOptionsAndOrObject,
    );
    expect(testData).not.toEqual(fixedMulticolumnJoinOptionsAndOrObject);
    expect(testData).toEqual([fixedKey, `second_${fixedKey}`]);
  });

  it('Check getSelectedFilters null value', () => {
    const testData = agGridArgsDecorator.getSelectedFilters(null);
    expect(testData).toEqual([]);
  });

  it('Check getSelectedFilters property null value', async () => {
    try {
      agGridArgsDecorator.getSelectedFilters({
        [fixedKey]: null,
      });
    } catch (error) {
      expect(error).toEqual(new AgGridInvalidPropertyError());
    }
  });

  it('Check createWhere with void where', async () => {
    const testData = agGridArgsDecorator.createWhere(null, fixedIFieldMapper);

    expect(testData).toEqual({ filters: {} });
  });

  it('Check createWhere with multicolumn object', async () => {
    const testData = agGridArgsDecorator.createWhere(
      fixedWhereMulticolumnObject,
      fixedIFieldMapper,
    );

    expect(testData).toBeDefined();
  });

  it('Check createWhere with multicolumn object and filters', async () => {
    const testData = agGridArgsDecorator.createWhere(
      fixedWhereMulticolumnAndFiltersObject,
      fixedIFieldMapper,
    );

    expect(testData).toBeDefined();
  });

  it('Check createWhere with long multicolumn object and filters', async () => {
    const testData = agGridArgsDecorator.createWhere(
      fixedLongWhereMulticolumnAndFiltersObject,
      fixedIFieldMapper,
    );

    expect(testData).toBeDefined();
  });

  it('Check createWhere with multicolumn and object', async () => {
    const testData = agGridArgsDecorator.createWhere(
      fixedWhereAndObject,
      fixedIFieldMapper,
    );

    expect(testData).toBeDefined();
  });

  it('Check checkFilterScope with where and include option', async () => {
    expect.assertions(1);
    try {
      const testData = agGridArgsDecorator.checkFilterScope(
        fixedWhereTransformed,
        fixedIncludefilterOption,
      );
      expect(testData).not.toBeDefined();
    } catch (error) {
      expect(error).not.toBeDefined();
    }
  });

  it('Check checkFilterScope with where and exclude option', async () => {
    expect.assertions(1);
    try {
      const testData = agGridArgsDecorator.checkFilterScope(
        fixedWhereTransformed,
        fixedExcludefilterOption,
      );
      expect(testData).not.toBeDefined();
    } catch (error) {
      expect(error).not.toBeDefined();
    }
  });

  it('Check checkFilterScope with not included filter', async () => {
    expect.assertions(1);
    try {
      agGridArgsDecorator.checkFilterScope(
        fixedWhereTransformedWithNotInclude,
        fixedIncludefilterOption,
      );
    } catch (error) {
      expect(error).toEqual(new AgGridFilterProhibited());
    }
  });

  it('Check checkFilterScope with excluded filter', async () => {
    expect.assertions(1);
    try {
      agGridArgsDecorator.checkFilterScope(
        fixedWhereTransformedWithExcluded,
        fixedExcludefilterOption,
      );
    } catch (error) {
      expect(error).toEqual(new AgGridFilterProhibited());
    }
  });

  it('Check checkFilterScope with where and include option', async () => {
    expect.assertions(1);
    try {
      const testData = agGridArgsDecorator.checkFilterScope(
        fixedWhereTransformedNested,
        fixedIncludefilterOption,
      );
      expect(testData).not.toBeDefined();
    } catch (error) {
      expect(error).not.toBeDefined();
    }
  });

  // Not the prettiest test, but since a lot is actually a decorator under the hood i think this is fine, we do not call this directly normally
  it('should be able to use the AgGridArgs to combine param decorators', () => {
    const ArgsFunc = jest.spyOn(graphql, 'Args');
    const returnFunc = jest.fn().mockReturnValue('somestring');
    ArgsFunc.mockReturnValue(returnFunc);
    //Without params type
    let decorator = agGridArgsDecorator.AgGridArgs({ fieldMap: {} });
    expect(decorator).toEqual(expect.any(Function));
    decorator('', '', 0);
    expect(returnFunc).toHaveBeenCalled();
    //With params type
    decorator = agGridArgsDecorator.AgGridArgs({
      fieldMap: {},
      type: () => String,
    });
    expect(decorator).toEqual(expect.any(Function));
    decorator('', '', 0);
    expect(returnFunc).toHaveBeenCalled();
  });

  it('should be able to use the AgGridArgsNoPagination to combine param decorators', () => {
    const ArgsFunc = jest.spyOn(graphql, 'Args');
    const returnFunc = jest.fn().mockReturnValue('somestring');
    ArgsFunc.mockReturnValue(returnFunc);
    //Without params type
    let decorator = agGridArgsDecorator.AgGridArgsNoPagination({
      fieldMap: {},
    });
    expect(decorator).toEqual(expect.any(Function));
    decorator('', '', 0);
    expect(returnFunc).toHaveBeenCalled();
    //With params type
    decorator = agGridArgsDecorator.AgGridArgsNoPagination({
      fieldMap: {},
      type: () => String,
    });
    expect(decorator).toEqual(expect.any(Function));
    decorator('', '', 0);
    expect(returnFunc).toHaveBeenCalled();
  });
});
