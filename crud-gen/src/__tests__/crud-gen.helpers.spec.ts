import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IFieldMapper } from '@nestjs-yalc/interfaces/maps.interface';
import { GraphQLResolveInfo } from 'graphql';
import { BaseEntity, Equal, SelectQueryBuilder } from 'typeorm';
import { FilterType, GeneralFilters, Operators } from '../crud-gen.enum';
import {
  CrudGenConditionNotSupportedError,
  CrudGenNotPossibleError,
  CrudGenStringWhereError,
} from '../crud-gen.error';
import {
  forceFilterWorker,
  forceFilters,
  columnConversion,
  isSymbolic,
  whereObjectToSqlString,
  isAskingForCount,
  isIFieldAndFilterMapper,
  objectToFieldMapper,
  ICrudGenDependencyFactoryOptions,
  CrudGenDependencyFactory,
  filterTypeToNativeType,
  traverseFiltersAndApplyFunction,
  isFilterExpressionInput,
  applyJoinArguments,
  getFieldMapperSrcByDst,
  getProviderToken,
  getMappedTypeProperties,
  getTypeProperties,
  applySelectOnFind,
  formatRawSelection,
  getDestinationFieldName,
} from '../crud-gen.helpers';
import { JoinArgOptions, JoinTypes } from '../crud-gen.input';
import { IWhereCondition } from '../crud-gen.type';
import * as ObjectDecorator from '../object.decorator';
import * as CrudGenHelpers from '../crud-gen.helpers';

import {
  FilterOption,
  FilterOptionType,
  ICrudGenFieldMetadata,
  IFieldAndFilterMapper,
} from '../object.decorator';
import {
  TestEntity,
  TestEntityDto,
  TestEntityRelation,
} from '../__mocks__/entity.mock';
import { GenericService } from '../generic-service.service';
import { GQLDataLoader } from '@nestjs-yalc/data-loader/dataloader.helper';
import { Resolver } from '@nestjs/graphql';

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
    {} as any,
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
  ['propertyName2']: {
    dst: 'propertyName2',
    src: 'propertyName2',
    gqlType: () => String,
  },
};

describe('Crud-gen helpers', () => {
  let mockedQueryBuilder: DeepMocked<SelectQueryBuilder<BaseEntity>>;

  beforeEach(() => {
    mockedQueryBuilder = createMock<SelectQueryBuilder<BaseEntity>>();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Check column conversion', async () => {
    let testColumnConversion: string | number;
    for (const test of columnConversionTests) {
      testColumnConversion = columnConversion(fixedKey, test.data);
      expect(testColumnConversion).toBeDefined();
    }
    testColumnConversion = columnConversion(fixedKey, undefined);
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

  it('should be able to use getDestinationFieldName', () => {
    const name = getDestinationFieldName({
      name: 'test',
      transformer: (dst, src) => {},
    });

    expect(name).toEqual('test');
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

  it('should be able to use the force filter on void where with descriptors', () => {
    const forceFilterTest = forceFilterWorker(undefined, 'id', 'id', {
      filterCondition: GeneralFilters.EQUAL,
      filterType: FilterType.TEXT,
    });

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
      expect(error).toEqual(new CrudGenStringWhereError());
    }
  });

  it('should return error on strange exception', () => {
    try {
      forceFilters(undefined, [], {});
    } catch (error) {
      expect(error).toEqual(new CrudGenNotPossibleError());
    }
  });

  it('should convert the object into a string and add the alias', async () => {
    const testData = whereObjectToSqlString<BaseEntity>(
      mockedQueryBuilder,
      fixedWhereObj,
      fixedAlias,
    );
    expect(testData).toEqual(
      "`alias`.`status` = 'verified' AND (`alias`.`status` = 'verified' AND (`alias`.`active` = 1 AND `alias`.`active` > 0))",
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
    }).toThrowError(CrudGenConditionNotSupportedError);
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
    }).toThrowError(CrudGenConditionNotSupportedError);
  });

  it('should run isAskingForCount', async () => {
    const info: Partial<GraphQLResolveInfo> = {
      fieldNodes: [
        {
          selectionSet: {
            selections: [
              {
                name: { value: 'pageData', kind: 'Name' },
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

    let result = isAskingForCount(info as GraphQLResolveInfo);
    expect(result).toBeTruthy();

    result = isAskingForCount({} as any);
    expect(result).toBeFalsy();

    result = isAskingForCount(undefined);
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
        .spyOn(ObjectDecorator, 'getCrudGenObjectMetadata')
        .mockReturnValueOnce(fixedObjectMetadata);

      const spiedgetCrudGenFieldMetadataList = jest.spyOn(
        ObjectDecorator,
        'getCrudGenFieldMetadataList',
      );
      spiedgetCrudGenFieldMetadataList.mockReturnValueOnce(fixedFieldMetaData);

      const fieldMapper = objectToFieldMapper(BaseEntity);
      expect(fieldMapper).toBeDefined();

      const result = objectToFieldMapper(BaseEntity);
      expect(result).toStrictEqual(fieldMapper);
    });

    it('Should convert an Entity object to a field mapper different fieldMetada configuration ', () => {
      jest
        .spyOn(ObjectDecorator, 'getCrudGenObjectMetadata')
        .mockReturnValue(fixedObjectMetadata);

      const spiedgetCrudGenFieldMetadataList = jest.spyOn(
        ObjectDecorator,
        'getCrudGenFieldMetadataList',
      );

      // Dst equals to src if undefined
      const customFieldMetadata = {
        ['propertyName']: {
          dst: undefined,
          src: 'propertyName',
        },
      };

      spiedgetCrudGenFieldMetadataList.mockReturnValueOnce(customFieldMetadata);
      let fieldMapper = objectToFieldMapper(new BaseEntity());
      expect(fieldMapper).toBeDefined();

      // src setted to undefined
      customFieldMetadata.propertyName.src = undefined;
      spiedgetCrudGenFieldMetadataList.mockReturnValueOnce(customFieldMetadata);
      fieldMapper = objectToFieldMapper(new BaseEntity());
      expect(fieldMapper).toBeDefined();

      // undefined fileldMetadata
      spiedgetCrudGenFieldMetadataList.mockReturnValueOnce(undefined);
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

    // it('Should throw an error with a bad object to convert', () => {
    //   const fieldMapper = () =>
    //     objectToFieldMapper({
    //       badFiled: {},
    //     } as any);
    //   expect(fieldMapper).toThrowError();
    // });
  });

  describe('CrudGenDependencyFactory', () => {
    // Object with override on provider
    const fixedCrudGenDependencyFactoryOptions: ICrudGenDependencyFactoryOptions<TestEntity> = {
      entityModel: TestEntity,
      dataloader: {
        databaseKey: 'id',
        provider: {
          provide: GQLDataLoader,
          useClass: GQLDataLoader,
        },
        entityModel: TestEntity,
      },
      service: {
        dbConnection: 'id',
        provider: {
          provide: () => GenericService,
          useClass: GenericService,
        },
        entityModel: TestEntity,
      },
      resolver: {
        provider: {
          provide: Resolver,
          useClass: TestEntity,
        },
      },
      repository: {} as any,
    };

    it('Should create a dependencyObject properly', () => {
      const dependecyObject = CrudGenDependencyFactory<TestEntity>(
        fixedCrudGenDependencyFactoryOptions,
      );

      expect(dependecyObject).toBeDefined();
    });

    it('Should create a dependencyObject properly with no override', () => {
      const customOptions: ICrudGenDependencyFactoryOptions<TestEntity> = {
        ...fixedCrudGenDependencyFactoryOptions,
        service: {
          dbConnection: 'id',
          entityModel: undefined,
          providerClass: GenericService,
        },
        dataloader: {
          entityModel: undefined,
          databaseKey: 'id',
        },
      };
      const dependecyObject = CrudGenDependencyFactory<TestEntity>(
        customOptions,
      );

      expect(dependecyObject).toBeDefined();
    });
    it('Should create a dependecyObject with default values', () => {
      const customOptions: ICrudGenDependencyFactoryOptions<TestEntity> = {
        ...fixedCrudGenDependencyFactoryOptions,
        resolver: undefined,
        service: undefined,
        dataloader: undefined,
        repository: undefined,
      };

      const dependecyObject = CrudGenDependencyFactory<TestEntity>(
        customOptions,
      );

      expect(dependecyObject).toBeDefined();
    });

    it('Should create a dependencyObject properly with defined entityModel', () => {
      const customOptions: ICrudGenDependencyFactoryOptions<TestEntity> = {
        ...fixedCrudGenDependencyFactoryOptions,
        service: {
          dbConnection: 'id',
          entityModel: TestEntity,
          providerClass: GenericService,
        },
        dataloader: {
          entityModel: TestEntity,
          databaseKey: 'id',
        },
      };
      const dependecyObject = CrudGenDependencyFactory<TestEntity>(
        customOptions,
      );

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
    applyJoinArguments(findManyOptions as any, 'alias', joinOptions, {
      innerJoinKey: { gqlType: () => String },
      leftJoinKey: {},
    });
    expect(Object.getOwnPropertyNames(findManyOptions)).toContain('join');
  });

  it('Should get field mapper source from destination if src is equal to dst', () => {
    const fieldMapper = {
      src: {
        dst: 'src',
      },
    };

    expect(getFieldMapperSrcByDst(fieldMapper, 'src')).toEqual('src');
  });

  it('Should get provider token', () => {
    const entityObj = {
      provide: TestEntity,
    };

    expect(getProviderToken(entityObj as any)).toBe('TestEntity');

    const entityObj2 = {
      provide: 'TestEntity',
    };
    expect(getProviderToken(entityObj2 as any)).toBe('TestEntity');
  });

  it('Should get mapped type property with denyFilter false', () => {
    jest.spyOn(CrudGenHelpers, 'objectToFieldMapper').mockReturnValueOnce({
      field: {
        id: {
          denyFilter: false,
          dst: 'id',
        },
      },
    });

    const result = getMappedTypeProperties(TestEntity);
    expect(result[0]).toBe('id');
  });

  it('Should get the column properties from an crud-gen field with mode derived', () => {
    const spiedgetCrudGenFieldMetadataList = jest.spyOn(
      ObjectDecorator,
      'getCrudGenFieldMetadataList',
    );

    const fieldMetadataList: { [key: string]: ICrudGenFieldMetadata } = {
      propertyName: {
        mode: 'derived',
      },
      propertyNameRegular: {
        mode: 'regular',
      },
    };
    spiedgetCrudGenFieldMetadataList.mockReturnValue(fieldMetadataList);
    const columns = getTypeProperties(TestEntity);

    const result = columns.find((e) => e.propertyName === 'propertyName');
    expect(result).toBeDefined();
  });

  it('Should check applySelectOnFinds', () => {
    const fieldMapper = {
      field1: {
        dst: '`data` -> "$.field1"',
        gqlType: undefined,
        gqlOptions: undefined,
        mode: 'derived',
        isRequired: true,
        _propertyName: 'field1',
      },
      field2: {
        dst: 'field2',
        gqlType: undefined,
        gqlOptions: undefined,
        _propertyName: 'field2',
      },
      field3: {
        dst: '`data` -> "$.field3"',
        gqlType: undefined,
        gqlOptions: undefined,
        mode: 'derived',
        isRequired: true,
        _propertyName: 'field3',
      },
      field4: {
        dst: 'field4',
        gqlType: undefined,
        gqlOptions: undefined,
        _propertyName: 'field4',
      },
    };
    const findOptionsTest1 = {};

    ['field1', 'field2', 'field3', 'field5'].forEach((field) =>
      applySelectOnFind(findOptionsTest1, field, fieldMapper),
    );
  });

  it('Should check applySelectOnFinds with path not endsWith dot', () => {
    const fieldMapper = {
      field1: {
        dst: '`data` -> "$.field1"',
        gqlType: undefined,
        gqlOptions: undefined,
        mode: 'derived',
        isRequired: true,
        _propertyName: 'field1',
      },
    };
    const findOptionsTest1 = {};

    applySelectOnFind(findOptionsTest1, 'field1', fieldMapper, 'alias', 'path');
  });

  it('Should check applySelectOnFinds with non empty findOptions', () => {
    const fieldMapper = {
      field1: {
        dst: '`data` -> "$.field1"',
        gqlType: undefined,
        gqlOptions: undefined,
        mode: 'derived',
        isRequired: true,
        _propertyName: 'field1',
      },
      field2: {
        dst: 'field2',
        gqlType: undefined,
        gqlOptions: undefined,
        _propertyName: 'field2',
      },
    };
    const findOptionsTest1 = {
      select: [],
      extra: {
        _keysMeta: undefined,
      },
    };

    ['field1', 'field2'].forEach((field) =>
      applySelectOnFind(findOptionsTest1, field, fieldMapper),
    );

    expect(findOptionsTest1.select).toEqual(['field2']);
  });

  it('Should check applySelectOnFinds that non apply two keyMeta on same field', () => {
    const fieldMapper = {
      field1: {
        dst: '`data` -> "$.field1"',
        gqlType: undefined,
        gqlOptions: undefined,
        mode: 'derived',
        isRequired: true,
        _propertyName: 'field1',
      },
    };
    const findOptionsTest1 = {};

    ['field1'].forEach((field) =>
      applySelectOnFind(findOptionsTest1, field, fieldMapper),
    );

    expect(Object.keys(findOptionsTest1.extra).length).toBe(1);

    ['field1'].forEach((field) =>
      applySelectOnFind(findOptionsTest1, field, fieldMapper),
    );

    expect(Object.keys(findOptionsTest1.extra).length).toBe(1);
  });

  it('Should check formatRawSelection with onlyAlias true', () => {
    const result = formatRawSelection('', '', 'prefix', true);
    expect(result).toBe('prefix_');
  });

  it('Should check formatRawSelection with onlyAlias false', () => {
    const result = formatRawSelection('selection', 'test', 'prefix');
    expect(result).toBe('prefix.selection AS `prefix_test`');
  });

  it('Should getEntityRelations properly with DTO', () => {
    const res = CrudGenHelpers.getEntityRelations(
      TestEntityRelation,
      TestEntityDto,
    );

    expect(res.join).not.toBeUndefined();
  });

  it('Should getEntityRelations properly without DTO', () => {
    const res = CrudGenHelpers.getEntityRelations(TestEntityRelation);

    expect(res.join).not.toBeUndefined();
  });
});