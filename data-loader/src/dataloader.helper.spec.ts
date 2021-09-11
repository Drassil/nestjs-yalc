import { createMock } from '@golevelup/ts-jest';
import { SortDirection } from '@nestjs-yalc/ag-grid/ag-grid.enum';
import { AgGridFindManyOptions } from '@nestjs-yalc/ag-grid/ag-grid.interface';
import { NotAcceptableException, NotFoundException } from '@nestjs/common';
import { GQLDataLoader } from './dataloader.helper';

describe('GQLDataLoader class', () => {
  class EntityTest {
    databaseKey: string;
    anotherField: string;

    constructor(databaseKey: string) {
      this.databaseKey = databaseKey;
    }
  }

  const mockLoadFn = jest.fn();
  const mockedFindManyOptions = createMock<AgGridFindManyOptions>();
  let dataLoader: GQLDataLoader<EntityTest>;

  beforeEach(() => {
    dataLoader = new GQLDataLoader(
      () => mockLoadFn(mockedFindManyOptions, false),
      'databaseKey',
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(dataLoader).toBeDefined();
  });

  it('should getCount', () => {
    expect(dataLoader.getCount()).toBe(0);
  });

  it('should loadOne', async () => {
    const obj = new EntityTest('asset_1');
    mockLoadFn.mockResolvedValue([[obj]]);
    await expect(dataLoader.loadOne('asset_1', {})).resolves.toBe(obj);
  });

  it('should loadOne with the same dataloader', async () => {
    const obj = new EntityTest('asset_1');
    mockLoadFn.mockResolvedValue([[obj]]);

    let findOptions = createMock<AgGridFindManyOptions<EntityTest>>();
    findOptions = {
      ...findOptions,
      order: { anotherField: SortDirection.ASC },
      where: { filters: { something: {} } },
      info: {
        ...findOptions.info,
        path: { ...findOptions.info.path, key: 'thisPath' },
      },
    };

    let findOptions2 = createMock<AgGridFindManyOptions<EntityTest>>();
    findOptions2 = {
      ...findOptions2,
      select: ['databaseKey'], // to cover one condition
      order: { databaseKey: SortDirection.ASC },
      where: { filters: {}, multiColumnJoinOptions: { filters: {} } },
      info: {
        ...findOptions2.info,
        path: { ...findOptions2.info.path, key: 'thatPath' },
      },
    };

    const res1 = await dataLoader.loadOne('asset_1', findOptions);

    const obj2 = new EntityTest('asset_1');
    mockLoadFn.mockResolvedValue([[obj2]]);

    const res2 = await dataLoader.loadOne('asset_1', findOptions);
    const res3 = await dataLoader.loadOne('asset_1', findOptions2);
    expect(res1 === res2).toBeTruthy();
    // the res3 will load the obj2 instead of the cached obj1 because of the different path in findOption2
    expect(res1 === res3).toBeFalsy();
  });

  it('should loadOne with not found error', async () => {
    expect.hasAssertions();
    const loadOneToManySpy = jest
      .spyOn(dataLoader, 'loadOneToMany')
      .mockResolvedValue(null);

    await expect(dataLoader.loadOne('asset_1', {}, true)).rejects.toThrowError(
      NotFoundException,
    );
    expect(loadOneToManySpy).toHaveBeenCalledTimes(1);
  });

  it('should loadOne with null result', async () => {
    expect.hasAssertions();
    const loadOneToManySpy = jest
      .spyOn(dataLoader, 'loadOneToMany')
      .mockResolvedValue(null);

    await expect(dataLoader.loadOne('asset_1', {}, false)).resolves.toBeNull();
    expect(loadOneToManySpy).toHaveBeenCalledTimes(1);
  });

  it('should loadOne with more than one result', async () => {
    expect.hasAssertions();
    const loadOneToManySpy = jest
      .spyOn(dataLoader, 'loadOneToMany')
      .mockResolvedValue([
        new EntityTest('asset_1'),
        new EntityTest('asset_2'),
      ]);

    await expect(dataLoader.loadOne('asset_1', {}, false)).rejects.toThrowError(
      NotAcceptableException,
    );
    expect(loadOneToManySpy).toHaveBeenCalledTimes(1);
  });

  it('should be able to load keys with fields in a singular manner', async () => {
    const output = [[new EntityTest('asset_1'), new EntityTest('asset_2')], 2];
    mockLoadFn.mockResolvedValue(output);
    await dataLoader.loadOneToMany('asset_1', {});
  });

  it('should return an empty list if no results are found', async () => {
    const output = [[]];
    mockLoadFn.mockResolvedValue(output);
    await dataLoader.loadOneToMany('asset_1', {});
  });

  it('should return an empty list if key not passed', async () => {
    const output = [[new EntityTest('asset_1')]];
    mockLoadFn.mockResolvedValue(output);
    const result = await dataLoader.loadOneToMany(undefined, {});
    expect(result.length).toBe(0);
  });

  it('should be able to load keys with fields in a singular manner when field is already present', async () => {
    const output = [[new EntityTest('asset_1'), new EntityTest('asset_1')]];
    mockLoadFn.mockResolvedValue(output);
    await dataLoader.loadOneToMany('asset_1', {});
  });
});
