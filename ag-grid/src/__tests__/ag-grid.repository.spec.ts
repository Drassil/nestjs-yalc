import {
  BaseEntity,
  EntityMetadata,
  FindOptionsUtils,
  SelectQueryBuilder,
} from 'typeorm';
import { AgGridRepository } from '../ag-grid.repository';
import { QueryBuilderHelper } from '@nestjs-yalc/database/query-builder.helper';
import { SortDirection } from '../ag-grid.enum';
import { DeepMocked } from '@golevelup/ts-jest';
import { mockQueryBuilder } from '@nestjs-yalc/jest/common-mocks.helper';
import { Alias } from 'typeorm/query-builder/Alias';

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

const getManyResult = [BaseEntity];

describe('AgGrid Repoository', () => {
  let newAgGridRepository: AgGridRepository<BaseEntity>;
  let mockedQueryBuilder: DeepMocked<SelectQueryBuilder<BaseEntity>>;

  beforeEach(() => {
    newAgGridRepository = new AgGridRepository();

    mockedQueryBuilder = mockQueryBuilder<BaseEntity>();
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

    QueryBuilderHelper.applyOperationToQueryBuilder = jest
      .fn()
      .mockResolvedValue([BaseEntity]);
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
});
