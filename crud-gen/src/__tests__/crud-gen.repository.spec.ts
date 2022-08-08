import {
  BaseEntity,
  EntityMetadata,
  FindOptionsUtils,
  SelectQueryBuilder,
} from 'typeorm';
import {
  AgGridRepository,
  AgGridRepositoryFactory,
} from '../crud-gen.repository';
import { QueryBuilderHelper } from '@nestjs-yalc/database/query-builder.helper';
import { SortDirection } from '../crud-gen.enum';
import { DeepMocked } from '@golevelup/ts-jest';
import { mockQueryBuilder } from '@nestjs-yalc/jest/common-mocks.helper';
import { Alias } from 'typeorm/query-builder/Alias';
import * as Typeorm from 'typeorm';
import * as AgGridHelpers from '../crud-gen.helpers';

jest.mock('typeorm');
jest.mock('typeorm/find-options/FindOptionsUtils');
jest.mock('@nestjs-yalc/database/query-builder.helper');

const fakeFindOptions = {
  take: 5,
  skip: 5,
  where: {
    filters: {
      status: {
        type: 'equal',
        value: 'verified',
        useParameter: true,
        multipleParameters: false,
      },
    },
  } as any,
  extra: {
    rawLimit: true,
  },
};

const fakeFindOptionsWithSubQuery = {
  ...fakeFindOptions,
  extra: {
    rawLimit: true,
  },
  subQueryFilters: {
    filters: {
      status: {
        type: 'equal',
        value: 'verified',
        useParameter: true,
        multipleParameters: false,
      },
    },
  } as any,
};

const fakeFindOptionsExtended = {
  ...fakeFindOptions,
  select: undefined,
  join: {
    innerJoinAndSelect: {
      key: 'key',
    },
    leftJoinAndSelect: {
      key: 'key2',
      key3: 'key3',
    },
  },
  extra: {
    _aliasType: 'aliasType',
    _keysMeta: {
      value: {
        fieldMapper: {
          mode: 'derived',
        },
        isNested: true,
        rawSelect: 'rawSelect',
      },
    },
    _fieldMapper: {
      key: {
        relation: {
          targetKey: {
            dst: 'dst',
          },
          sourceKey: {
            dst: 'dst',
          },
        },
      },
      key2: undefined,
      key3: {
        relation: undefined,
      },
    },
  },
};

const getManyResult = [BaseEntity];

describe('AgGrid Repoository', () => {
  let newAgGridRepository: AgGridRepository<BaseEntity>;
  let mockedQueryBuilder: DeepMocked<SelectQueryBuilder<BaseEntity>>;

  beforeEach(() => {
    newAgGridRepository = new AgGridRepository();

    mockedQueryBuilder = mockQueryBuilder<BaseEntity>();
    mockedQueryBuilder.getCount = jest.fn().mockReturnValue(1);
    mockedQueryBuilder.getMany = jest.fn().mockReturnValue(getManyResult);
    mockedQueryBuilder.getManyAndCount = jest
      .fn()
      .mockReturnValue([getManyResult, 1]);
    mockedQueryBuilder.getQuery = jest
      .fn()
      .mockReturnValue('SELECT * FROM fakeTable');

    jest
      .spyOn(newAgGridRepository, 'createQueryBuilder')
      .mockImplementation(() => mockedQueryBuilder);

    jest
      .spyOn(FindOptionsUtils, 'applyFindManyOptionsOrConditionsToQueryBuilder')
      .mockImplementation(() => mockedQueryBuilder);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Should be defined', () => {
    expect(newAgGridRepository).toBeDefined();
  });

  it('getManyAgGrid should work', async () => {
    jest
      .spyOn(newAgGridRepository, 'getFormattedAgGridQueryBuilder')
      .mockReturnValueOnce(mockedQueryBuilder);
    const testData = newAgGridRepository.getManyAgGrid({});
    await expect(testData).resolves.toEqual(getManyResult);
  });

  it('countAgGrid should work', async () => {
    jest
      .spyOn(newAgGridRepository, 'getFormattedAgGridQueryBuilder')
      .mockReturnValueOnce(mockedQueryBuilder);
    const testData = newAgGridRepository.countAgGrid({});
    await expect(testData).resolves.toEqual(1);
  });

  it('getManyAndCountAgGrid should work', async () => {
    jest
      .spyOn(newAgGridRepository, 'getAgGridQueryBuilder')
      .mockReturnValue(mockedQueryBuilder);

    let testData = await newAgGridRepository.getManyAndCountAgGrid({
      take: 100,
    });
    expect(testData).toEqual([getManyResult, getManyResult.length]);

    let findOptions: any = {
      skip: 1,
      take: 3,
      extra: {
        skipCount: true,
      },
    };

    testData = await newAgGridRepository.getManyAndCountAgGrid(findOptions);
    expect(testData).toEqual([
      getManyResult,
      getManyResult.length + findOptions.skip,
    ]);

    findOptions = {
      skip: 1,
      take: 3,
      extra: {
        skipCount: true,
      },
      subQueryFilters: {},
    };

    testData = await newAgGridRepository.getManyAndCountAgGrid(findOptions);
    expect(testData).toEqual([
      getManyResult,
      getManyResult.length + findOptions.skip,
    ]);

    testData = await newAgGridRepository.getManyAndCountAgGrid({
      extra: {
        skipCount: true,
      },
      subQueryFilters: {
        skip: 0,
        take: 1,
      },
    });
    // with skipCount = true
    // we asked for 1 result and received exactly one, it means that
    // we do not know if there are further elements, so it returns -1
    expect(testData).toEqual([getManyResult, -1]);

    testData = await newAgGridRepository.getManyAndCountAgGrid({
      extra: { skipCount: false },
    });
    expect(testData).toEqual([getManyResult, getManyResult.length]);
  });

  it('getFormattedAgGridQueryBuilder should return a queryBuilder', () => {
    jest
      .spyOn(QueryBuilderHelper, 'applyOrderToJoinedQueryBuilder')
      .mockReturnValue([
        {
          key: `Parent.property`,
          operator: SortDirection.ASC,
        },
      ]);

    let testData = newAgGridRepository.getFormattedAgGridQueryBuilder(
      {},
      {
        parent: { userId: { dst: 'guid' } },
        joined: { userId: { dst: 'guid' } },
      },
    );
    expect(testData).toEqual(mockedQueryBuilder);

    testData = newAgGridRepository.getFormattedAgGridQueryBuilder(
      fakeFindOptions,
      {
        parent: { userId: { dst: 'guid' } },
        joined: { userId: { dst: 'guid' } },
      },
      mockedQueryBuilder,
    );

    expect(testData).toEqual(mockedQueryBuilder);
  });

  it('getAgGridQueryBuilder should return a queryBuilder with a rawSelection passed', () => {
    jest
      .spyOn(QueryBuilderHelper, 'applyOrderToJoinedQueryBuilder')
      .mockReturnValue([
        {
          key: `Parent.property`,
          operator: SortDirection.ASC,
        },
      ]);

    const testData = newAgGridRepository.getFormattedAgGridQueryBuilder(
      { select: ['data -> $.test'] },
      {
        parent: { userId: { dst: 'guid' } },
        joined: { userId: { dst: 'guid' } },
      },
    );
    expect(testData).toEqual(mockedQueryBuilder);
  });

  describe('Check getAgGridQueryBuilder with the join logic and derived field', () => {
    beforeEach(() => {
      jest
        .spyOn(QueryBuilderHelper, 'applyOrderToJoinedQueryBuilder')
        .mockReturnValue([
          {
            key: `Parent.property`,
            operator: SortDirection.ASC,
          },
        ]);
    });

    it('Should work properly with join and derived mode in findOptions ', () => {
      const testData = newAgGridRepository.getFormattedAgGridQueryBuilder(
        fakeFindOptionsExtended,
        {
          parent: { userId: { dst: 'guid' } },
          joined: { userId: { dst: 'guid' } },
        },
      );
      expect(testData).toEqual(mockedQueryBuilder);
    });
    it('Should work properly with undefined field in derived mode in findOptions', () => {
      const tempFindOptions = { ...fakeFindOptionsExtended };

      tempFindOptions.extra._keysMeta.value.isNested = undefined;

      let testData = newAgGridRepository.getFormattedAgGridQueryBuilder(
        tempFindOptions,
        {
          parent: { userId: { dst: 'guid' } },
          joined: { userId: { dst: 'guid' } },
        },
      );
      expect(testData).toEqual(mockedQueryBuilder);

      tempFindOptions.extra._keysMeta.value = undefined;

      testData = newAgGridRepository.getFormattedAgGridQueryBuilder(
        tempFindOptions,
        {
          parent: { userId: { dst: 'guid' } },
          joined: { userId: { dst: 'guid' } },
        },
      );
      expect(testData).toEqual(mockedQueryBuilder);
    });

    it('Should work properly with undefined in join field', () => {
      const tempFindOptions = { ...fakeFindOptionsExtended };
      tempFindOptions.extra._fieldMapper.key.relation = undefined;
      tempFindOptions.join.innerJoinAndSelect = undefined;

      const testData = newAgGridRepository.getFormattedAgGridQueryBuilder(
        tempFindOptions,
        {
          parent: { userId: { dst: 'guid' } },
          joined: { userId: { dst: 'guid' } },
        },
      );
      expect(testData).toEqual(mockedQueryBuilder);
    });
    it('Should work properly with extra field undefined', () => {
      const tempFindOptions = {
        ...fakeFindOptionsExtended,
        extra: undefined,
      };

      const testData = newAgGridRepository.getFormattedAgGridQueryBuilder(
        tempFindOptions,
        {
          parent: { userId: { dst: 'guid' } },
          joined: { userId: { dst: 'guid' } },
        },
      );
      expect(testData).toEqual(mockedQueryBuilder);
    });
  });
  it('getAgGridQueryBuilder should return a queryBuilder', () => {
    jest
      .spyOn(QueryBuilderHelper, 'applyOrderToJoinedQueryBuilder')
      .mockReturnValue([
        {
          key: `Parent.property`,
          operator: SortDirection.ASC,
        },
      ]);

    let testData = newAgGridRepository.getAgGridQueryBuilder(
      {
        ...fakeFindOptionsWithSubQuery,
      },
      {
        parent: { userId: { dst: 'guid' } },
        joined: { userId: { dst: 'guid' } },
      },
    );

    expect(testData).toEqual(mockedQueryBuilder);

    const alias = new Alias();
    alias.metadata = new EntityMetadata({} as any);
    mockedQueryBuilder.expressionMap.mainAlias = alias;

    testData = newAgGridRepository.getAgGridQueryBuilder(
      {
        ...fakeFindOptionsWithSubQuery,
      },
      {
        parent: { userId: { dst: 'guid' } },
        joined: { userId: { dst: 'guid' } },
      },
    );

    expect(testData).toEqual(mockedQueryBuilder);

    const newQueryBuilder = mockQueryBuilder();
    newQueryBuilder.expressionMap.mainAlias = alias;
    mockedQueryBuilder.expressionMap.mainAlias = null;
    mockedQueryBuilder.connection.createQueryBuilder = jest
      .fn()
      .mockReturnValue(newQueryBuilder);

    testData = newAgGridRepository.getAgGridQueryBuilder(
      {
        ...fakeFindOptionsWithSubQuery,
      },
      {
        parent: { userId: { dst: 'guid' } },
        joined: { userId: { dst: 'guid' } },
      },
    );

    expect(testData).toEqual(mockedQueryBuilder);
  });

  it('getOneAgGrid should return an entity correctly', async () => {
    jest
      .spyOn(newAgGridRepository, 'getFormattedAgGridQueryBuilder')
      .mockReturnValueOnce(mockedQueryBuilder);

    QueryBuilderHelper.applyOperationToQueryBuilder = jest
      .fn()
      .mockImplementation((qb, mode, fn) => {
        fn(qb);
        fn = jest.fn().mockResolvedValue(BaseEntity);
        return fn();
      });

    const result = await newAgGridRepository.getOneAgGrid({});
    expect(result).toStrictEqual(BaseEntity);
  });

  it('getOneAgGrid should return an entity correctly with fail', async () => {
    jest
      .spyOn(newAgGridRepository, 'getFormattedAgGridQueryBuilder')
      .mockReturnValueOnce(mockedQueryBuilder);

    QueryBuilderHelper.applyOperationToQueryBuilder = jest
      .fn()
      .mockImplementation((qb, mode, fn) => {
        fn(qb);
        fn = jest.fn().mockResolvedValue(BaseEntity);
        return fn();
      });

    const result = await newAgGridRepository.getOneAgGrid({}, true);
    expect(result).toStrictEqual(BaseEntity);
  });

  it('AGGridRepoFactory should return the repo already cached', () => {
    const spiedEntityRepository = jest
      .spyOn(Typeorm, 'EntityRepository')
      .mockImplementationOnce(() => jest.fn());

    let result = AgGridRepositoryFactory<BaseEntity>(BaseEntity);
    expect(result).toBeDefined();

    result = AgGridRepositoryFactory<BaseEntity>(BaseEntity);
    expect(result).toBeDefined();

    expect(spiedEntityRepository).toBeCalledTimes(1);
  });

  it('Should check generateFilterOnPrimaryColumn with ids as number', () => {
    const ids = 2;
    newAgGridRepository.metadata = {
      primaryColumns: [
        {
          propertyName: 'id',
        },
      ],
    } as any;
    const result = newAgGridRepository.generateFilterOnPrimaryColumn(ids);
    expect(result).toEqual({
      id: ` = '2'`,
    });
  });

  it('Should check generateFilterOnPrimaryColumn with ids as object', () => {
    const ids = {
      id: '2',
    };
    newAgGridRepository.metadata = {
      primaryColumns: [
        {
          propertyName: 'id',
        },
      ],
    } as any;
    const result = newAgGridRepository.generateFilterOnPrimaryColumn(ids);
    expect(result).toEqual({
      id: ` = '2'`,
    });
  });
  it('Should check genereteSelectOnFind', () => {
    jest.spyOn(AgGridHelpers, 'objectToFieldMapper').mockReturnValue({});
    jest
      .spyOn(AgGridHelpers, 'applySelectOnFind')
      .mockImplementation((findOptions, field, fieldMapperField) => {
        findOptions.select = [];
        findOptions.select.push('id');
        findOptions.select.push('data -> $.field');
      });
    newAgGridRepository.generateSelectOnFind(['id'], BaseEntity);
  });
});
