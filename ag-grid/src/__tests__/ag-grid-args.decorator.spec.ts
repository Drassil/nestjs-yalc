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
  BaseEntity,
} from 'typeorm';
import { IAgQueryParams } from '../ag-grid.args';
import { ExtraArgsStrategy, GeneralFilters } from '../ag-grid.enum';
import { GqlExecutionContext } from '@nestjs/graphql';
import {
  mockedExecutionContext,
  mockedNestGraphql,
} from '@nestjs-yalc/jest/common-mocks.helper';
import {
  FilterInput,
  FilterModel,
  IAgGridArgsOptions,
  ICombinedSimpleModel,
} from '../ag-grid.interface';
import * as graphql from '@nestjs/graphql';
import * as AgGridInput from '../ag-grid.input';
import * as GqlAgGridDecorator from '../gqlfields.decorator';
import * as AgGridHelpers from '../ag-grid.helpers';
import {
  AgGridFilterNotSupportedError,
  AgGridFilterProhibited,
  AgGridInvalidArgumentError,
  AgGridInvalidOperatorError,
  AgGridError,
} from '../ag-grid.error';
import { DateHelper } from '@nestjs-yalc/utils/date.helper';
import { GraphQLResolveInfo } from 'graphql';
import { createMock } from '@golevelup/ts-jest';
import {
  fixedArgsNoFilters,
  fixedArgsNOTFilter,
  fixedArgsOptions,
  fixedArgsQueryParams,
  fixeDatedArgs,
  fixedBadArgs,
  fixedCombinedAndTextFilter,
  fixedCombinedInvalidArgsTextFilter,
  fixedCombinedInvalidOperatorTextFilter,
  fixedCombinedOrTextFilter,
  fixedDataWithDefault,
  fixedExcludefilterOption,
  fixedIFieldMapper,
  fixedIncludefilterOption,
  fixedJoinOptionsAndOrObject,
  fixedNotTextFilter,
  fixedSetFilter,
  fixedSimpleBadFilter,
  fixedSimpleDateFilter,
  fixedSimpleNumberFilter,
  fixedSimpleTextFilter,
  fixedUndefinedTextFilter,
  fixedWhereTransformed,
  fixedWhereTransformedNested,
  fixedWhereTransformedWithExcluded,
  fixedWhereTransformedWithNotInclude,
  fixeNumberArgs,
  genExtraArgs,
} from '../__mocks__/filter.mocks';

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

const fixedDataFilterToInclude: IAgGridArgsOptions = {
  fieldMap: {
    field: fixedIFieldMapper,
    filterOption: fixedIncludefilterOption,
  },
};

const mockedInfo = createMock<GraphQLResolveInfo>();

const mockCreate = (mockedNestGraphql.GqlExecutionContext.create = jest.fn());
mockCreate.mockImplementation(() => ({
  getArgs: jest.fn().mockReturnValue(fixedArgsQueryParams),
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
    ).toThrowError(
      new AgGridFilterNotSupportedError(`filter: ImAnError type: TEXT`),
    );
    expect(() =>
      agGridArgsDecorator.getNumberFilter('ImAnError', firstNumberParameter),
    ).toThrowError(
      new AgGridFilterNotSupportedError(`filter: ImAnError type: NUMBER`),
    );
    expect(() =>
      agGridArgsDecorator.getDateFilter('ImAnError', firstDateParameter),
    ).toThrowError(
      new AgGridFilterNotSupportedError(`filter: ImAnError type: DATE`),
    );
  });

  it('Check AgGridArgsFactory functionality', async () => {
    const testData = agGridArgsDecorator.AgGridArgsFactory(
      fixedArgsOptions,
      mockedExecutionContext,
    );

    expect(testData).toBeDefined();
  });

  describe('Check mapAgGridParams', () => {
    const testData: [string, IAgQueryParams][] = [
      ['text filter', fixedArgsQueryParams],
      ['number filter', fixeNumberArgs],
      ['data filter', fixeDatedArgs],
      ['bad filter', fixedBadArgs],
      ['no filter', fixedArgsNoFilters],
    ];

    const resultFn = (params) => () =>
      agGridArgsDecorator.mapAgGridParams(
        params,
        mockedGqlExecutionContext,
        fixedArgsQueryParams,
        mockedInfo,
      );

    it.each(testData)('Should map on %s', (name, args) => {
      const result = agGridArgsDecorator.mapAgGridParams(
        fixedArgsOptions,
        mockedGqlExecutionContext,
        args,
        mockedInfo,
      );

      expect(result).toBeDefined();
    });

    it('Should throw error with bad extraArgs property', () => {
      const params: IAgGridArgsOptions = {
        ...fixedArgsOptions,
        extraArgsStrategy: ExtraArgsStrategy.AT_LEAST_ONE,
        extraArgs: {
          ...genExtraArgs('extra'),
        },
      };

      expect(resultFn(params)).toThrowError();

      params.extraArgsStrategy = ExtraArgsStrategy.ONLY_ONE;
      params.extraArgs = {
        ...genExtraArgs('rowGroups'),
        ...genExtraArgs('groupKeys'),
      };

      expect(resultFn(params)).toThrowError();
    });

    it('Should work properly with extraArgs property', () => {
      const params: IAgGridArgsOptions = {
        ...fixedArgsOptions,
        extraArgsStrategy: ExtraArgsStrategy.AT_LEAST_ONE,
        extraArgs: {
          ...genExtraArgs('groupKeys'),
        },
      };

      expect(resultFn(params)()).toBeDefined();
      params.extraArgsStrategy = ExtraArgsStrategy.ONLY_ONE;
      params.extraArgs = {
        ...genExtraArgs('rowGroups'),
      };

      expect(resultFn(params)()).toBeDefined();

      params.extraArgsStrategy = ExtraArgsStrategy.DEFAULT;
      expect(resultFn(params)()).toBeDefined();
    });
  });

  it('Check filters not functionality', async () => {
    const testData = agGridArgsDecorator.mapAgGridParams(
      fixedArgsOptions,
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
      fixedArgsQueryParams,
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

  it('Check mapAgGridParams throws error if row selected is too high', () => {
    try {
      agGridArgsDecorator.mapAgGridParams(
        fixedArgsOptions,
        mockedGqlExecutionContext,
        { filters: {}, startRow: 0, endRow: 500 },
        mockedInfo,
      );
    } catch (error) {
      const { maxRow } = fixedArgsOptions.options;
      expect(error).toEqual(
        new AgGridError(
          `Invalid max number of row selected: cannot exeed max ${maxRow}`,
        ),
      );
    }
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

  describe('resolveFilter', () => {
    const testData: [string, FilterModel][] = [
      ['text', fixedSimpleTextFilter],
      ['number', fixedSimpleNumberFilter],
      ['date', fixedSimpleDateFilter],
      ['set', fixedSetFilter],
      ['not supported', {} as FilterModel],
    ];

    it.each(testData)('Check conversion with %s filter', (name, filter) => {
      try {
        const result = agGridArgsDecorator.resolveFilter(filter);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(AgGridFilterNotSupportedError);
      }
    });
  });
  describe('Check convertFilter', () => {
    const testData: [
      string,
      FilterModel | ICombinedSimpleModel,
      AgGridError?,
    ][] = [
      ['simple', fixedSimpleTextFilter, undefined],
      ['undefined', fixedUndefinedTextFilter, new AgGridInvalidArgumentError()],
      ['combined OR', fixedCombinedOrTextFilter, undefined],
      ['combined AND', fixedCombinedAndTextFilter, undefined],
      [
        'combined invalid operator',
        <ICombinedSimpleModel>fixedCombinedInvalidOperatorTextFilter,
        new AgGridInvalidOperatorError(),
      ],
      [
        'combined invalid args',
        fixedCombinedInvalidArgsTextFilter,
        new AgGridInvalidArgumentError(),
      ],
      ['not type in text', fixedNotTextFilter, undefined],
    ];

    it.each(testData)(`Should convert %s Filter`, (name, filter, error) => {
      if (error) {
        const result = () => agGridArgsDecorator.convertFilter(filter);
        expect(result).toThrowError(error);
      } else {
        const result = agGridArgsDecorator.convertFilter(filter);
        expect(result).toBeDefined();
      }
    });
  });

  it('should check filterSwitch is working properly', async () => {
    // with SET
    let testData = agGridArgsDecorator.filterSwitch(fixedSetFilter);

    expect(testData).toStrictEqual(In(fixedSetFilter.values));

    // with TEXT
    testData = agGridArgsDecorator.filterSwitch(
      fixedSimpleTextFilter,
      'contains',
    );
    expect(testData).toStrictEqual(Like(`%${fixedSimpleTextFilter.filter}%`));

    // with Date
    testData = agGridArgsDecorator.filterSwitch(fixedSimpleDateFilter, 'equal');
    expect(testData).toStrictEqual(Equal(`${fixedSimpleDateFilter.dateFrom}`));

    // With number
    testData = agGridArgsDecorator.filterSwitch(
      fixedSimpleNumberFilter,
      'equal',
    );
    expect(testData).toStrictEqual(Equal(fixedSimpleNumberFilter.filter));

    // with INVALID

    expect(() =>
      agGridArgsDecorator.filterSwitch(fixedSimpleBadFilter),
    ).toThrow(AgGridFilterNotSupportedError);
  });

  it('Check removeSymbolicSelection work', async () => {
    const testData = agGridArgsDecorator.removeSymbolicSelection(
      [`second_${fixedKey}`, `third_${fixedKey}`],
      fixedIFieldMapper,
    );

    expect(testData).toEqual([`second_${fixedKey}`]);
  });

  describe('Check createWhere', () => {
    it('Should work with void where', async () => {
      const testData = agGridArgsDecorator.createWhere(null, fixedIFieldMapper);
      expect(testData).toEqual({ filters: {} });
    });

    it(`Should work properly with filterInput object`, () => {
      const testData = agGridArgsDecorator.createWhere(
        fixedJoinOptionsAndOrObject,
        fixedIFieldMapper,
        'alias',
      );

      expect(testData).toBeDefined();
    });

    it('Should throw error with bad filters', () => {
      const badFilter: FilterInput = {
        ...fixedJoinOptionsAndOrObject,
        expressions: [
          {
            text: fixedSimpleTextFilter,
            number: fixedSimpleNumberFilter,
          },
        ],
      };
      const func = (badFilter) => () =>
        agGridArgsDecorator.createWhere(badFilter, fixedIFieldMapper);

      expect(func(badFilter)).toThrowError();

      badFilter.expressions = [
        {
          nothing: undefined,
        } as any,
      ];

      expect(func(badFilter)).toThrowError();

      badFilter.expressions = [
        {
          nothing: 'test',
        } as any,
      ];
      expect(func(badFilter)).toThrowError(AgGridFilterNotSupportedError);
    });
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
    let decorator = agGridArgsDecorator.AgGridArgs(fixedArgsOptions);
    expect(decorator).toEqual(expect.any(Function));
    decorator('', '', 0);
    expect(returnFunc).toHaveBeenCalled();
    //With params type
    decorator = agGridArgsDecorator.AgGridArgs(fixedArgsOptions);
    expect(decorator).toEqual(expect.any(Function));
    decorator('', '', 0);
    expect(returnFunc).toHaveBeenCalled();
  });

  it('should be able to use the AgGridArgsNoPagination to combine param decorators', () => {
    const ArgsFunc = jest.spyOn(graphql, 'Args');
    const returnFunc = jest.fn().mockReturnValue('somestring');
    ArgsFunc.mockReturnValue(returnFunc);
    //With params type
    const argsOptions: IAgGridArgsOptions = {
      ...fixedArgsOptions,
      entityType: BaseEntity,
    };
    let decorator = agGridArgsDecorator.AgGridArgsNoPagination(argsOptions);
    expect(decorator).toEqual(expect.any(Function));
    decorator('', '', 0);
    expect(returnFunc).toHaveBeenCalled();
    //Without params type
    decorator = agGridArgsDecorator.AgGridArgsNoPagination({});
    expect(decorator).toEqual(expect.any(Function));
    decorator('', '', 0);
    expect(returnFunc).toHaveBeenCalled();
  });

  it('Should combine decorators with AgGridCombineDecorators', () => {
    const ArgsFunc = jest.spyOn(graphql, 'Args');
    const returnFunc = jest.fn().mockReturnValue('somestring');
    ArgsFunc.mockReturnValue(returnFunc);

    const decorator =
      agGridArgsDecorator.AgGridCombineDecorators(fixedArgsOptions);
    expect(decorator).toEqual(expect.any(Function));
  });

  describe('Check AgGridArgsSingleDecoratorMapper', () => {
    const qqlAgGridFieldsMapper = jest.spyOn(
      GqlAgGridDecorator,
      'GqlAgGridFieldsMapper',
    );

    const objectToFieldMapper = jest.spyOn(
      AgGridHelpers,
      'objectToFieldMapper',
    );

    beforeEach(() => {
      qqlAgGridFieldsMapper.mockReturnValueOnce(['field']);
      objectToFieldMapper.mockReturnValueOnce({ field: {} });
    });

    afterEach(() => {
      qqlAgGridFieldsMapper.mockReset();
      objectToFieldMapper.mockReset();
    });

    it('Should map to FindManyOptions', () => {
      const argsOptions: IAgGridArgsOptions = {
        ...fixedArgsOptions,
        entityType: BaseEntity,
      };
      const result = agGridArgsDecorator.AgGridArgsSingleDecoratorMapper(
        argsOptions,
        fixedArgsQueryParams,
        mockedInfo,
      );

      expect(result.select).toEqual(['field']);
    });

    it('Should map to findManyOptions with bad arguments', () => {
      const argsOptions: IAgGridArgsOptions = {
        ...fixedArgsOptions,
        entityType: BaseEntity,
      };

      const queryParam: IAgQueryParams = {
        ...fixedArgsQueryParams,
        join: null,
      };
      const result = agGridArgsDecorator.AgGridArgsSingleDecoratorMapper(
        argsOptions,
        queryParam,
        mockedInfo,
      );

      expect(result.select).toEqual(['field']);
      expect(qqlAgGridFieldsMapper).toHaveBeenCalled();
      expect(objectToFieldMapper).toHaveBeenCalled();
    });

    it('Should return an empty findManyOptions with bad arguments', () => {
      const argsOptions: IAgGridArgsOptions = {
        ...fixedArgsOptions,
      };

      let result = agGridArgsDecorator.AgGridArgsSingleDecoratorMapper(
        argsOptions,
        fixedArgsQueryParams,
        mockedInfo,
      );

      expect(result).toEqual({});

      result = agGridArgsDecorator.AgGridArgsSingleDecoratorMapper(
        null,
        fixedArgsQueryParams,
        mockedInfo,
      );
      expect(result).toEqual({});
      expect(qqlAgGridFieldsMapper).not.toHaveBeenCalled();
      expect(objectToFieldMapper).not.toHaveBeenCalled();
    });
  });

  it('Should be able to use the AgGridArgsSingle', () => {
    const ArgsFunc = jest.spyOn(graphql, 'Args');
    const returnFunc = jest.fn().mockReturnValue('somestring');
    ArgsFunc.mockReturnValue(returnFunc);

    const joinArgFactory = jest
      .spyOn(AgGridInput, 'agJoinArgFactory')
      .mockReturnValueOnce({});

    const checkExpect = () => {
      decorator('', '', 0);
      expect(returnFunc).toHaveBeenCalled();
      expect(joinArgFactory).toHaveBeenCalled();
    };

    const argsOptions: IAgGridArgsOptions = {
      ...fixedArgsOptions,
      entityType: BaseEntity,
    };

    let decorator = agGridArgsDecorator.AgGridArgsSingle(argsOptions);
    checkExpect();

    joinArgFactory.mockReturnValueOnce(null);
    decorator = agGridArgsDecorator.AgGridArgsSingle(argsOptions);
    checkExpect();

    argsOptions.entityType = null;
    decorator = agGridArgsDecorator.AgGridArgsSingle(argsOptions);
    checkExpect;
  });

  it('Should be call AgGridArgsSingleDecoratorFactory correctly', () => {
    const decorator = agGridArgsDecorator.AgGridArgsSingleDecoratorFactory(
      fixedArgsOptions,
      mockedGqlExecutionContext,
    );
    expect(decorator).toBeDefined();
  });

  describe('getFindOperator', () => {
    const testData = [
      {
        type: fixedSimpleTextFilter.filterType,
        name: GeneralFilters.EQUALS,
        arg1: firstTextParameter,
        arg2: undefined,
      },
      {
        type: fixedSimpleDateFilter.filterType,
        name: GeneralFilters.EQUALS,
        arg1: firstDateParameter,
        arg2: secondDateParameter,
      },
      {
        type: fixedSimpleNumberFilter.filterType,
        name: GeneralFilters.EQUALS,
        arg1: firstNumberParameter,
        arg2: undefined,
      },
      {
        type: fixedSetFilter.filterType,
        name: GeneralFilters.EQUALS,
        arg1: '',
        arg2: undefined,
      },
      {
        type: fixedSetFilter.filterType,
        name: GeneralFilters.IS_NULL,
        arg1: undefined,
        arg2: undefined,
      },
    ];

    it('Should work properly', () => {
      testData.forEach((test) => {
        const result = agGridArgsDecorator.getFindOperator(
          test.type,
          test.name,
          test.arg1,
          test.arg2,
        );
        expect(result).toBeDefined();
      });
    });
  });
});
