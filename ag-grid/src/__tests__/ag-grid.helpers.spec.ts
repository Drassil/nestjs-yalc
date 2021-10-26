import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IFieldMapper } from '@nestjs-yalc/interfaces/maps.interface';
import { BaseEntity, Equal, SelectQueryBuilder } from 'typeorm';
import { FilterType, Operators } from '../ag-grid.enum';
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
  isIFieldAndFilterMapper,
  objectToFieldMapper,
  IAgGridDependencyFactoryOptions,
  AgGridDependencyFactory,
  filterTypeToNativeType,
  traverseFiltersAndApplyFunction,
  isFilterExpressionInput,
  applyJoinArguments,
} from '../ag-grid.helpers';
import { JoinArgOptions, JoinTypes } from '../ag-grid.input';
import { IWhereCondition } from '../ag-grid.type';
import * as ObjectDecorator from '../object.decorator';
import {
  FilterOption,
  FilterOptionType,
  IFieldAndFilterMapper,
} from '../object.decorator';
import { TestEntity } from '../__mocks__/entity.mock';

const fixedKey = 'passed';
const dbName = 'original';

interface IFieldMapperTest {
  data: IFieldMapper;
  result: string;
}

const fixedAlias = 'alias';
const fixedWhereObj: IWhereCondition = {
  operator: Operators.AND,
  childExpressions: [
    {
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
  ],
  filters: {
    status: {
      type: 'equal',
      value: 'verified',
      useParameter: true,
      multipleParameters: false,
    } as any,
  },
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
  {
    data: { [fixedKey]: { dst: '', isSymbolic: true } },
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

const fixedObjectMetadata: FilterOption = {
  fields: ['test'],
  type: FilterOptionType.EXCLUDE,
};

const fixedFieldMetaData = {
  ['propertyName']: {
    dst: 'propertyName',
    src: 'customPropertyName',
  },
};

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

  it('Check isIFieldAndFilterMapper with IFieldMapper', async () => {
    const testData = isIFieldAndFilterMapper(fixedIFieldMapper);

    expect(testData).toEqual(false);
  });

  it('Check isIFieldAndFilterMapper with undefined', async () => {
    const testData = isIFieldAndFilterMapper(undefined);

    expect(testData).toEqual(false);
  });

  it('Check isIFieldAndFilterMapper with IFieldAndFilterMapper', async () => {
    const testData = isIFieldAndFilterMapper({
      field: fixedIFieldMapper as IFieldMapper,
    });

    expect(testData).toEqual(true);
  });

  describe('ObjectToFieldMapper', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('should convert an Entity object to a field mapper already cached', () => {
      jest
        .spyOn(ObjectDecorator, 'getAgGridObjectMetadata')
        .mockReturnValueOnce(fixedObjectMetadata);

      const spiedgetAgGridFieldMetadataList = jest.spyOn(
        ObjectDecorator,
        'getAgGridFieldMetadataList',
      );
      spiedgetAgGridFieldMetadataList.mockReturnValueOnce(fixedFieldMetaData);

      const fieldMapper = objectToFieldMapper(BaseEntity);
      expect(fieldMapper).toBeDefined();

      const result = objectToFieldMapper(BaseEntity);
      expect(result).toStrictEqual(fieldMapper);
    });

    it('Should convert an Entity object to a field mapper different fieldMetada configuration ', () => {
      jest
        .spyOn(ObjectDecorator, 'getAgGridObjectMetadata')
        .mockReturnValue(fixedObjectMetadata);

      const spiedgetAgGridFieldMetadataList = jest.spyOn(
        ObjectDecorator,
        'getAgGridFieldMetadataList',
      );

      // Dst equals to src if undefined
      const customFieldMetadata = {
        ['propertyName']: {
          dst: undefined,
          src: 'propertyName',
        },
      };

      spiedgetAgGridFieldMetadataList.mockReturnValueOnce(customFieldMetadata);
      let fieldMapper = objectToFieldMapper(new BaseEntity());
      expect(fieldMapper).toBeDefined();

      // src setted to undefined
      customFieldMetadata.propertyName.src = undefined;
      spiedgetAgGridFieldMetadataList.mockReturnValueOnce(customFieldMetadata);
      fieldMapper = objectToFieldMapper(new BaseEntity());
      expect(fieldMapper).toBeDefined();

      // undefined fileldMetadata
      spiedgetAgGridFieldMetadataList.mockReturnValueOnce(undefined);
      fieldMapper = objectToFieldMapper(new BaseEntity());
      expect(fieldMapper).toBeDefined();
    });

    it('Should convert a FieldMapper object to a field mapper', () => {
      const fieldMapper = objectToFieldMapper(fixedIFieldMapper);
      expect(fieldMapper).toBeDefined();
    });

    it('Should convert a FieldAndFilterMapper to a field mapepr', () => {
      const fieldMapper = objectToFieldMapper({
        field: {},
      } as IFieldAndFilterMapper);
      expect(fieldMapper).toBeDefined();
    });

    it('Should throw an error with a bad object to convert', () => {
      const fieldMapper = () =>
        objectToFieldMapper({
          badFiled: {},
        } as any);
      expect(fieldMapper).toThrowError();
    });
  });

  describe('AgGridDependencyFactory', () => {
    const fixedAgGridDependencyFactoryOptions: IAgGridDependencyFactoryOptions<TestEntity> =
      {
        entityModel: TestEntity,
        dataloader: {
          databaseKey: 'id',
          providerClass: TestEntity,
          entityModel: TestEntity,
        },
        service: {
          providerClass: TestEntity,
          entityModel: TestEntity,
        },
        resolver: {
          providerClass: TestEntity,
        },
        repository: {} as any,
      };

    it('Should create a dependencyObject properly', () => {
      const dependecyObject = AgGridDependencyFactory<TestEntity>(
        fixedAgGridDependencyFactoryOptions,
      );

      expect(dependecyObject).toBeDefined();
    });

    it('Should throw an error if service e dataloader are not defined when using custom ones', () => {
      let customOptions: IAgGridDependencyFactoryOptions<TestEntity> = {
        ...fixedAgGridDependencyFactoryOptions,
        resolver: undefined,
        service: {
          providerClass: undefined,
          entityModel: undefined,
        },
      };

      let dependecyObject = () =>
        AgGridDependencyFactory<TestEntity>(customOptions);
      expect(dependecyObject).toThrowError();

      customOptions = {
        ...fixedAgGridDependencyFactoryOptions,
        dataloader: {
          providerClass: undefined,
          entityModel: undefined,
        },
      };
      dependecyObject = () =>
        AgGridDependencyFactory<TestEntity>(customOptions);
      expect(dependecyObject).toThrowError();
    });

    it('Should create a dependecyObject with default values', () => {
      const customOptions: IAgGridDependencyFactoryOptions<TestEntity> = {
        ...fixedAgGridDependencyFactoryOptions,
        resolver: undefined,
        service: undefined,
        dataloader: undefined,
      };

      const dependecyObject =
        AgGridDependencyFactory<TestEntity>(customOptions);

      expect(dependecyObject).toBeDefined();
    });
  });

  const testTypeFiler: [FilterType, any][] = [
    [FilterType.TEXT, String],
    [FilterType.DATE, Date],
    [FilterType.NUMBER, Number],
    [FilterType.SET, Array],
  ];
  it.each(testTypeFiler)(
    'Should convert %s filter type to native type',
    (filterType, nativeType) => {
      expect(filterTypeToNativeType(filterType)).toBe(nativeType);
    },
  );
  it('Should throw error if it is not supported the native conversion', () => {
    const testFn = () => filterTypeToNativeType(FilterType.MULTI);
    expect(testFn).toThrowError();
  });

  it('Should check if a filter has a filterExpressionInput', () => {
    expect(isFilterExpressionInput({})).toBeFalsy();
    expect(isFilterExpressionInput({ expressions: {} })).toBeTruthy();
  });

  it('Should traverseFilterAndApplFunction work properly', () => {
    traverseFiltersAndApplyFunction(fixedWhereObj, (filters, filter) => {
      expect(filters).toBeDefined();
      expect(filter).toBeDefined();
    });
  });

  it('Should apply join arguments correctly to a findManyOptions object', () => {
    const joinOptions: { [index: string]: JoinArgOptions } = {
      ['innerJoinKey']: {
        joinType: JoinTypes.INNER_JOIN,
        filters: {},
      },
      ['leftJoinKey']: {
        joinType: JoinTypes.LEFT_JOIN,
      },
    };

    const findManyOptions = {};
    applyJoinArguments(findManyOptions as any, 'alias', joinOptions, {});
    expect(Object.getOwnPropertyNames(findManyOptions)).toContain('join');
  });
});
