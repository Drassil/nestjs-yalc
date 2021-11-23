import { IFieldMapper } from '@nestjs-yalc/interfaces';
import { Equal } from 'typeorm';
import { IAgQueryParams } from '../ag-grid.args';
import {
  FilterType,
  GeneralFilters,
  Operators,
  SortDirection,
} from '../ag-grid.enum';
import {
  DateFilterModel,
  FilterInput,
  IAgGridArgsOptions,
  ICombinedSimpleModel,
  IExtraArg,
  IMultiColumnJoinOptions,
  INumberFilterModel,
  ISetFilterModel,
  ISimpleFilterModel,
  ITextFilterModel,
} from '../ag-grid.interface';
import { IWhereCondition } from '../ag-grid.type';
import { FilterOption, FilterOptionType } from '../object.decorator';

const fixedKey = 'passed';
const dbName = 'original';

// UTILS FUNCTION
export const genExtraArgs = (name: string): { [index: string]: IExtraArg } => {
  return {
    [name]: {
      filterType: FilterType.TEXT,
      filterCondition: GeneralFilters.EQUALS,
      options: {},
    },
  };
};

/*
  FIELD MAPPER
*/
interface IFieldMapperTest {
  data: IFieldMapper;
  result: string;
}

export const columnConversionTests: IFieldMapperTest[] = [
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

export const fixedIFieldMapper: IFieldMapper<any> = {
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

/* 
  FILTER MODEL
*/

export const fixedSimpleTextFilter: ITextFilterModel = {
  filterType: FilterType.TEXT,
  type: GeneralFilters.CONTAINS,
  filter: '_',
  field: fixedKey,
};

export const fixedUndefinedTextFilter: ITextFilterModel = {
  filterType: FilterType.TEXT,
  type: GeneralFilters.CONTAINS,
  filter: undefined,
  field: fixedKey,
};

export const fixedSimpleBadFilter: ISimpleFilterModel = {
  filterType: 'wrong' as any,
  type: GeneralFilters.CONTAINS,
  filter: '_',
  field: fixedKey,
};

export const fixedNotTextFilter: ITextFilterModel = {
  ...fixedSimpleTextFilter,
  type: GeneralFilters.NOT_CONTAINS,
};

export const fixedSimpleNumberFilter: INumberFilterModel = {
  filterType: FilterType.NUMBER,
  type: GeneralFilters.LESS_THAN,
  filter: 0,
  field: fixedKey,
};

export const fixedSetFilter: ISetFilterModel = {
  filterType: FilterType.SET,
  values: [1, 2],
  field: fixedKey,
};

export const fixedSimpleDateFilter: DateFilterModel = {
  filterType: FilterType.DATE,
  type: GeneralFilters.LESS_THAN,
  dateTo: '2019',
  dateFrom: '2020',
  field: fixedKey,
};

const fixedFilterNotContains: ITextFilterModel = {
  filterType: FilterType.TEXT,
  type: GeneralFilters.NOT_CONTAINS,
  filter: '_',
  field: fixedKey,
};

export const fixedMulticolumnJoinOptionsAndOrObject: IMultiColumnJoinOptions = {
  multiColumnJoinOperator: Operators.AND,
  [fixedKey]: fixedSimpleTextFilter,
  [`second_${fixedKey}`]: fixedSimpleTextFilter,
  multiColumnJoinOptions: {
    multiColumnJoinOperator: Operators.OR,
    [`third_${fixedKey}`]: fixedSimpleTextFilter,
    [`second_${fixedKey}`]: fixedSimpleNumberFilter,
  },
};

export const fixedMultiColumnObject: IMultiColumnJoinOptions = {
  multiColumnJoinOperator: Operators.AND,
  [fixedKey]: fixedSimpleTextFilter,
};

export const fixedCombinedOrDateFilter: ICombinedSimpleModel = {
  filterType: FilterType.DATE,
  operator: Operators.OR,
  condition1: fixedSimpleDateFilter,
  condition2: fixedSimpleDateFilter,
};

/* 
  COMBINED SIMPLE FILTER MODEL
*/
export const fixedCombinedAndTextFilter: ICombinedSimpleModel = {
  filterType: FilterType.TEXT,
  operator: Operators.AND,
  condition1: fixedSimpleTextFilter,
  condition2: fixedSimpleTextFilter,
};

export const fixedCombinedOrTextFilter: ICombinedSimpleModel = {
  filterType: FilterType.TEXT,
  operator: Operators.OR,
  condition1: fixedSimpleTextFilter,
  condition2: fixedSimpleTextFilter,
};

export const fixedCombinedInvalidOperatorTextFilter: ICombinedSimpleModel = {
  filterType: FilterType.TEXT,
  operator: 'invalid' as any,
  condition1: fixedSimpleTextFilter,
  condition2: fixedSimpleTextFilter,
};

export const fixedCombinedInvalidArgsTextFilter: ICombinedSimpleModel = {
  filterType: FilterType.TEXT,
  operator: Operators.OR,
  condition1: undefined,
  condition2: undefined,
};

export const fixedCombinedOrNumberFilter: ICombinedSimpleModel = {
  filterType: FilterType.NUMBER,
  operator: Operators.OR,
  condition1: fixedSimpleNumberFilter,
  condition2: fixedSimpleNumberFilter,
};

// AgGrid Args Options
export const fixedArgsOptions: IAgGridArgsOptions = {
  fieldMap: fixedIFieldMapper,
  options: {
    maxRow: 200,
  },
  extraArgs: {
    ...genExtraArgs('default'),
  },
  extraArgsStrategy: null,
  defaultValue: {},
};

export const fixedDataWithDefault: IAgGridArgsOptions = {
  fieldMap: fixedIFieldMapper,
  defaultValue: {
    sorting: [
      {
        colId: '',
      },
    ],
    startRow: 5,
  },
};

/* 
  FILTER INPUT
*/

export const fixedFilterInputDate: FilterInput = {
  expressions: [
    {
      date: fixedSimpleDateFilter,
    },
  ],
};

export const fixedFilterInputNumber: FilterInput = {
  expressions: [
    {
      number: fixedSimpleNumberFilter,
    },
  ],
};

export const fixedJoinOptionsAndOrObject: FilterInput = {
  operator: Operators.AND,
  expressions: [
    {
      text: fixedSimpleTextFilter,
    },
    {
      text: fixedSimpleTextFilter,
    },
  ],
  childExpressions: [
    {
      operator: Operators.OR,
      expressions: [
        {
          text: fixedSimpleTextFilter,
        },
        {
          text: fixedSimpleTextFilter,
        },
      ],
    },
  ],
};

/*
  FILTER OPTION
*/

export const fixedIncludefilterOption: FilterOption = {
  type: FilterOptionType.INCLUDE,
  fields: [dbName, `second_${dbName}`, `third_${dbName}`],
};

export const fixedExcludefilterOption: FilterOption = {
  type: FilterOptionType.EXCLUDE,
  fields: [`excluded_${dbName}`],
};

/*
  Ag QUERY PARAMS
*/

export const fixedArgsNoFilters: IAgQueryParams = {
  startRow: 0,
  endRow: 0,
  sorting: [
    {
      colId: '',
      sort: SortDirection.ASC,
    },
  ],
  rowGroups: [
    {
      colId: '',
      aggFunc: '',
    },
  ],
  groupKeys: [''],
  filters: null,
};

export const fixedArgsQueryParams: IAgQueryParams = {
  ...fixedArgsNoFilters,
  filters: {
    expressions: [
      {
        text: fixedSimpleTextFilter,
      },
    ],
  },
  join: {},
};

export const fixeNumberArgs: IAgQueryParams = {
  ...fixedArgsNoFilters,
  filters: { ...fixedFilterInputNumber },
};

export const fixeDatedArgs: IAgQueryParams = {
  ...fixedArgsNoFilters,
  filters: { ...fixedFilterInputDate },
};

export const fixedBadArgs: IAgQueryParams = {
  ...fixedArgsQueryParams,
  filters: {
    expressions: [{ text: fixedSimpleBadFilter as ITextFilterModel }],
  },
};
export const fixedArgsNOTFilter: IAgQueryParams = {
  ...fixedArgsQueryParams,
  filters: { expressions: [{ text: fixedFilterNotContains }] },
};

export const fixedWhereTransformed: IWhereCondition = {
  filters: { [dbName]: Equal('') },
  childExpressions: [
    {
      operator: Operators.AND,
      filters: { [`table.${dbName}`]: Equal('') },
    },
  ],
};

export const fixedWhereTransformedWithNotInclude: IWhereCondition = {
  filters: { [dbName]: Equal(''), exluded: Equal('') },
  childExpressions: [
    {
      operator: Operators.AND,
      filters: { [`table.${dbName}`]: Equal('') },
    },
  ],
};

export const fixedWhereTransformedWithExcluded: IWhereCondition = {
  filters: { [dbName]: Equal(''), [`excluded_${dbName}`]: Equal('') },
  childExpressions: [
    {
      operator: Operators.AND,
      filters: { [`table.${dbName}`]: Equal('') },
    },
  ],
};

export const fixedWhereTransformedNested: IWhereCondition = {
  filters: { [dbName]: Equal('') },
  childExpressions: [
    {
      operator: Operators.AND,
      filters: { [`table.${dbName}`]: Equal('') },
      childExpressions: [
        {
          operator: Operators.AND,
          filters: { [`table.${dbName}`]: Equal('') },
        },
      ],
    },
  ],
};
