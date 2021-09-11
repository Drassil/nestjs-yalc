import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IFieldMapper } from '@nestjs-yalc/interfaces/maps.interface';
import { BaseEntity, Equal, SelectQueryBuilder } from 'typeorm';
import { Operators } from '../ag-grid.enum';
import {
  AgGridConditionNotSupportedError,
  AgGridNotPossibleError,
  AgGridStringWhereError,
} from '../ag-grid.error';
import {
  forceFilterWorker,
  forceFilters,
  columnConversion,
  isSymbolic,
  whereObjectToSqlString,
  isAskingForCount,
} from '../ag-grid.helpers';
import { IWhereCondition } from '../ag-grid.type';

const fixedKey = 'passed';
const dbName = 'original';

interface IFieldMapperTest {
  data: IFieldMapper;
  result: string;
}

const fixedAlias = 'alias';
const fixedWhereObj: IWhereCondition = {
  multiColumnJoinOptions: {
    operator: Operators.AND,
    filters: {
      status: {
        type: 'equal',
        value: 'verified',
        useParameter: true,
        multipleParameters: false,
      } as any,
      active: {
        operator: Operators.AND,
        filter_1: {
          type: 'equal',
          value: 1,
          useParameter: true,
          multipleParameters: false,
        },
        filter_2: {
          type: 'moreThan',
          value: 0,
          useParameter: true,
          multipleParameters: false,
        },
      } as any,
    },
  },
  filters: {
    status: {
      type: 'equal',
      value: 'verified',
      useParameter: true,
      multipleParameters: false,
    } as any,
  },
};

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
  {
    data: { [fixedKey]: { dst: '', isSymbolic: true } },
    result: fixedKey,
  },
];

describe('Ag-grid helpers', () => {
  let mockedQueryBuilder: DeepMocked<SelectQueryBuilder<BaseEntity>>;

  beforeEach(() => {
    mockedQueryBuilder = createMock<SelectQueryBuilder<BaseEntity>>();
  });

  it('Check column conversion', async () => {
    let testColumnConversion: string | number;
    for (const test of columnConversionTests) {
      testColumnConversion = columnConversion(test.data, fixedKey);
      expect(testColumnConversion).toBeDefined();
      expect(testColumnConversion).toEqual(test.result);
    }
    testColumnConversion = columnConversion(undefined, fixedKey);
    expect(testColumnConversion).toBeDefined();
    expect(testColumnConversion).toEqual(fixedKey);
  });

  it('should be able to use isSymbolic', () => {
    const forceFilterTest = isSymbolic(
      { [fixedKey]: { dst: '', isSymbolic: true } },
      fixedKey,
    );

    expect(forceFilterTest).toEqual(true);
  });

  it('should return false when isSymbolic is not defined', () => {
    const forceFilterTest = isSymbolic({ [fixedKey]: { dst: '' } }, fixedKey);

    expect(forceFilterTest).toEqual(false);
  });

  it('should return false when data of key is not defined', () => {
    const forceFilterTest = isSymbolic({ [fixedKey]: undefined }, fixedKey);

    expect(forceFilterTest).toEqual(false);
  });

  it('should return null on void data', () => {
    const forceFilterTest = isSymbolic(null, fixedKey);

    expect(forceFilterTest).toEqual(false);
  });

  it('should be able to use the force filter on void where', () => {
    const forceFilterTest = forceFilterWorker(undefined, 'id', 'id');

    expect(forceFilterTest).toEqual({
      filters: {
        ['id']: Equal('id'),
      },
    });
  });

  it('should be able to use the force filter on not void where', () => {
    const forceFilterTest = forceFilterWorker(
      { filters: { ['something']: Equal('something') } },
      'id',
      'id',
    );

    expect(forceFilterTest).toEqual({
      filters: {
        ['something']: Equal('something'),
        ['id']: Equal('id'),
      },
    });
  });

  it('should be able to use the force filters', () => {
    const forceFilterTest = forceFilters(
      { filters: {} },
      [{ key: 'any', value: 'any' }],
      {},
    );

    expect(forceFilterTest).toEqual({
      filters: {
        ['any']: Equal('any'),
      },
    });
  });

  it('should be able to use the force filters on where', () => {
    const forceFilterTest = forceFilters(
      { filters: { ['key']: Equal('key') } },
      [{ key: 'any', value: 'any' }],
      {},
    );

    expect(forceFilterTest).toEqual({
      filters: {
        ['any']: Equal('any'),
        ['key']: Equal('key'),
      },
    });
  });

  it("should be able to don't apply the filter on a null value", () => {
    const forceFilterTest = forceFilters(
      { filters: { ['key']: Equal('key') } },
      [{ key: 'any', value: null }],
      {},
    );

    expect(forceFilterTest).toEqual({
      filters: {
        ['key']: Equal('key'),
      },
    });
  });

  it('should return error on where string', () => {
    try {
      forceFilters('string', [{ key: 'any', value: 'any' }], {});
    } catch (error) {
      expect(error).toEqual(new AgGridStringWhereError());
    }
  });

  it('should return error on strange exception', () => {
    try {
      forceFilters(undefined, [], {});
    } catch (error) {
      expect(error).toEqual(new AgGridNotPossibleError());
    }
  });

  it('should convert the object into a string and add the alias', async () => {
    const testData = whereObjectToSqlString<BaseEntity>(
      mockedQueryBuilder,
      fixedWhereObj,
      fixedAlias,
    );
    expect(testData).toEqual(
      "(`alias`.`status` = 'verified' AND (`alias`.`active` = 1 AND `alias`.`active` > 0)) AND `alias`.`status` = 'verified'",
    );
  });

  it('should convert the object into a string', async () => {
    const filters: any = {
      status: {
        type: 'equal',
        value: 'verified',
        useParameter: true,
        multipleParameters: false,
      },
    };

    const testData = whereObjectToSqlString<BaseEntity>(mockedQueryBuilder, {
      filters,
    });
    expect(testData).toEqual("status = 'verified'");
  });

  it('should return empty sql', async () => {
    const testData = whereObjectToSqlString<BaseEntity>(
      mockedQueryBuilder,
      {} as any,
    );
    expect(testData).toEqual('');
  });

  it('should throw error on wrong condition', async () => {
    const filters: any = {
      something: {
        operator: Operators.AND,
      },
    };

    expect(() => {
      whereObjectToSqlString<BaseEntity>(mockedQueryBuilder, {
        filters,
      });
    }).toThrowError(AgGridConditionNotSupportedError);
  });

  it('should throw error on wrong filter', async () => {
    expect(() => {
      const filters: any = {
        operator: 'and',
        status: {
          type: 'equal',
          value: undefined,
        },
      };
      whereObjectToSqlString<BaseEntity>(mockedQueryBuilder, {
        filters,
      });
    }).toThrowError(AgGridConditionNotSupportedError);
  });

  it('should run isAskingForCount', async () => {
    const info = {
      fieldNodes: [
        {
          selectionSet: {
            selections: [
              {
                name: { value: 'pageData' },
                selectionSet: {
                  selections: [
                    {
                      name: {
                        value: 'count',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };

    let result = isAskingForCount(info);
    expect(result).toBeTruthy();

    result = isAskingForCount({});
    expect(result).toBeFalsy();
  });
});
