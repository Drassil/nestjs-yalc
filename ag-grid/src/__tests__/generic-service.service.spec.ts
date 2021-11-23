import * as GenericServiceModule from '../generic-service.service';
import {
  GenericService,
  GenericServiceFactory,
} from '../generic-service.service';
import {
  BaseEntity,
  Connection,
  Repository,
  getConnection,
  QueryFailedError,
  InsertResult,
  UpdateResult,
  DeleteResult,
} from 'typeorm';
import { baseEntityRepository } from '../__mocks__/generic-service.mocks';
import { mocked } from 'ts-jest/utils';
import { getConnectionName } from '@nestjs-yalc/database/conn.helper';
import { createMock } from '@golevelup/ts-jest';
import { AgGridRepository } from '@nestjs-yalc/ag-grid/ag-grid.repository';
import { ConnectionNotFoundError } from 'typeorm';
import { FactoryProvider } from '@nestjs/common';
import {
  CreateEntityError,
  DeleteEntityError,
  UpdateEntityError,
} from '../entity.error';
import {
  NoResultsFoundError,
  ConditionsTooBroadError,
} from '../conditions.error';
jest.mock('typeorm');

describe('GenericService', () => {
  let service: GenericService<BaseEntity>;
  let mockedGetConnection: any;

  beforeEach(async () => {
    mockedGetConnection = mocked(getConnection, true);

    service = new GenericService(baseEntityRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call the factory function properly', () => {
    const spiedGenerciService = jest
      .spyOn(GenericServiceModule, 'GenericService')
      .mockImplementation(jest.fn());

    const result: FactoryProvider = GenericServiceFactory<BaseEntity>(
      () => BaseEntity,
      'fakeConnection',
      GenericService,
    );
    expect(result).toBeDefined();
    expect(result.useFactory()).toBeDefined();

    expect(spiedGenerciService).toHaveBeenCalledTimes(1);

    spiedGenerciService.mockRestore();
  });

  it('Check GenericServiceFactory provide object to work properly ', () => {
    const spiedGenerciService = jest
      .spyOn(GenericServiceModule, 'GenericService')
      .mockImplementation(jest.fn());

    const result: FactoryProvider = GenericServiceFactory<BaseEntity>(
      BaseEntity,
      'fakeConnection',
    );

    expect(result).toBeDefined();
    expect(result.provide).toEqual('BaseEntityGenericService');
    spiedGenerciService.mockRestore();
  });

  it('Should GenericServiceFactory works properly with default values ', () => {
    const spiedGenerciService = jest
      .spyOn(GenericServiceModule, 'GenericService')
      .mockImplementation(jest.fn());

    const result: FactoryProvider = GenericServiceFactory<BaseEntity>(
      'BaseEntity' as any,
      'fakeConnection',
    );

    expect(result).toBeDefined();
    spiedGenerciService.mockRestore();
  });

  it('Check getServiceToken', () => {
    const serviceToken = GenericServiceModule.getServiceToken(BaseEntity);
    expect(serviceToken).toEqual('BaseEntityGenericService');
  });

  it('Check getEntity', async () => {
    const spiedGetEntity = jest.spyOn(service, 'getEntity');
    await service.getEntity('', undefined, undefined, undefined, {
      failOnNull: false,
    });
    expect(baseEntityRepository.findOne).toHaveBeenCalledTimes(1);
    spiedGetEntity.mockClear();
  });

  it('Check getEntity', async () => {
    const spiedGetEntity = jest.spyOn(service, 'getEntity');
    await service.getEntityOrFail('');
    expect(baseEntityRepository.findOneOrFail).toHaveBeenCalledTimes(1);
    spiedGetEntity.mockClear();
  });

  it('Check getEntity with relations', async () => {
    const spiedGetEntity = jest.spyOn(service, 'getEntity');
    expect(spiedGetEntity).not.toHaveBeenCalled();
    await service.getEntity({}, [], ['RelatedEntity']);
    expect(baseEntityRepository.findOneOrFail).toBeCalledWith({
      where: {},
      select: [],
      relations: ['RelatedEntity'],
    });
    spiedGetEntity.mockClear();
  });

  it('Check getEntity with specific Database', async () => {
    const testRepository = createMock<Repository<BaseEntity>>();
    const mockedConnection = createMock<Connection>();
    mockedConnection.getRepository.mockReturnValue(testRepository);
    mockedGetConnection.mockReturnValueOnce(mockedConnection);

    const mockedEntity = new BaseEntity();
    testRepository.findOneOrFail.mockResolvedValue(mockedEntity);

    // Checks the base repository to be set before changing it
    expect(service.getRepository()).toBe(baseEntityRepository);

    const entity = await service.getEntity(
      '',
      undefined,
      undefined,
      'databaseName',
    );

    expect(mockedConnection.getRepository).toHaveBeenCalledWith(
      baseEntityRepository.target,
    );
    expect(mockedGetConnection).toHaveBeenCalledWith(
      getConnectionName('databaseName'),
    );
    expect(service.getRepository()).toBe(testRepository);
    expect(entity).toBe(mockedEntity);
  });

  it('Check getEntityList', async () => {
    const mockedList: BaseEntity[] = [new BaseEntity()];
    const spiedGetEntityList = jest.spyOn(service, 'getEntityList');
    baseEntityRepository.find.mockResolvedValue(mockedList);
    expect(spiedGetEntityList).not.toHaveBeenCalled();
    const entityList = await service.getEntityList({});
    expect(entityList).toBe(mockedList);
    spiedGetEntityList.mockClear();
  });

  it('Check getEntityList with count', async () => {
    const mockedCountedList: [BaseEntity[], number] = [[new BaseEntity()], 1];
    const spiedGetEntityList = jest.spyOn(service, 'getEntityList');
    baseEntityRepository.findAndCount.mockResolvedValue(mockedCountedList);
    expect(spiedGetEntityList).not.toHaveBeenCalled();
    const entityList = await service.getEntityList({}, true);
    expect(entityList).toBe(mockedCountedList);
    spiedGetEntityList.mockClear();
  });

  it('Check getEntityList with false count', async () => {
    const mockedList: BaseEntity[] = [new BaseEntity()];
    const spiedGetEntityList = jest.spyOn(service, 'getEntityList');
    baseEntityRepository.find.mockResolvedValue(mockedList);
    expect(spiedGetEntityList).not.toHaveBeenCalled();
    const entityList = await service.getEntityList({}, false);
    expect(entityList).toBe(mockedList);
    spiedGetEntityList.mockClear();
  });

  it('Check getEntityList with relations', async () => {
    const mockedList: BaseEntity[] = [new BaseEntity()];
    const spiedGetEntityList = jest.spyOn(service, 'getEntityList');
    baseEntityRepository.find.mockResolvedValue(mockedList);
    expect(spiedGetEntityList).not.toHaveBeenCalled();
    const entityList = await service.getEntityList({}, false, [
      'RelatedEntity',
    ]);
    expect(baseEntityRepository.find).toBeCalledWith({
      relations: ['RelatedEntity'],
    });
    expect(entityList).toBe(mockedList);
    spiedGetEntityList.mockClear();
  });

  it('Check getEntityList with specific Database', async () => {
    const testRepository = createMock<AgGridRepository<BaseEntity>>();
    const mockedConnection = createMock<Connection>();
    mockedConnection.getRepository.mockReturnValue(testRepository);
    mockedGetConnection.mockReturnValueOnce(mockedConnection);

    const mockedList: BaseEntity[] = [new BaseEntity()];
    testRepository.find.mockResolvedValue(mockedList);

    // Checks the base repository to be set before changing it
    expect(service.getRepository()).toBe(baseEntityRepository);

    const entityList = await service.getEntityList(
      {},
      false,
      [],
      'databaseName',
    );

    expect(mockedConnection.getRepository).toHaveBeenCalledWith(
      baseEntityRepository.target,
    );
    expect(mockedGetConnection).toHaveBeenCalledWith(
      getConnectionName('databaseName'),
    );
    expect(service.getRepository()).toBe(testRepository);
    expect(entityList).toBe(mockedList);
  });

  it('Should insert an entity correctly', async () => {
    const mockedEntity = new BaseEntity();
    const insertResult = new InsertResult();
    insertResult.identifiers = [{ id: '123' }];

    baseEntityRepository.insert.mockResolvedValueOnce(insertResult);
    baseEntityRepository.getOneAgGrid.mockResolvedValueOnce(mockedEntity);
    const result = await service.createEntity({});
    expect(result).toBe(mockedEntity);
  });

  it('Should update an entity correctly', async () => {
    const mockedEntity = new BaseEntity();

    baseEntityRepository.find.mockResolvedValueOnce([mockedEntity]);
    baseEntityRepository.update.mockResolvedValueOnce(new UpdateResult());
    baseEntityRepository.getOneAgGrid.mockResolvedValueOnce(mockedEntity);

    const result = await service.updateEntity({}, {});
    expect(result).toBe(mockedEntity);
  });

  it('should delete an entity correctly', async () => {
    const deleteResult = new DeleteResult();
    deleteResult.affected = 1;

    baseEntityRepository.find.mockResolvedValueOnce([new BaseEntity()]);
    baseEntityRepository.delete.mockResolvedValueOnce(deleteResult);

    const result = await service.deleteEntity({});
    expect(result).toBeTruthy();
  });

  it('should handle an insertion error', async () => {
    baseEntityRepository.insert.mockRejectedValueOnce(
      new QueryFailedError('', [], ''),
    );

    expect(service.createEntity({})).rejects.toThrow(CreateEntityError);
  });

  it('should handle an update error', async () => {
    baseEntityRepository.find.mockResolvedValueOnce([new BaseEntity()]);
    baseEntityRepository.update.mockRejectedValueOnce(
      new QueryFailedError('', [], ''),
    );

    expect(service.updateEntity({}, {})).rejects.toThrow(UpdateEntityError);
  });

  it('should handle a deletion error', async () => {
    baseEntityRepository.find.mockResolvedValueOnce([new BaseEntity()]);
    baseEntityRepository.delete.mockRejectedValueOnce(
      new QueryFailedError('', [], ''),
    );

    expect(service.deleteEntity({})).rejects.toThrow(DeleteEntityError);
  });

  it('should not handle a differnt kind of error', async () => {
    jest.spyOn(service, 'validateConditions').mockImplementation(jest.fn());
    baseEntityRepository.delete.mockRejectedValueOnce(
      new ConnectionNotFoundError('Another Error'),
    );

    await expect(service.deleteEntity({})).rejects.toEqual({});
  });

  it('Tests the conditions validation checks is empty', async () => {
    baseEntityRepository.find.mockResolvedValueOnce([]);

    expect(service.validateConditions({})).rejects.toThrow(NoResultsFoundError);
  });

  it('Checks if the validation works when the conditions return too many results', async () => {
    baseEntityRepository.find.mockResolvedValueOnce([
      new BaseEntity(),
      new BaseEntity(),
    ]);

    expect(service.validateConditions({})).rejects.toThrow(
      ConditionsTooBroadError,
    );
  });
  it('test getEntityListAgGrid', async () => {
    const mockedList: BaseEntity[] = [new BaseEntity()];
    baseEntityRepository.find.mockResolvedValue(mockedList);
    const entityListAgGrid = await service.getEntityListAgGrid({});
    expect(entityListAgGrid).toBeDefined();
  });

  it('test getEntityListAgGrid with count', async () => {
    const mockedCountedList: [BaseEntity[], number] = [[new BaseEntity()], 1];
    baseEntityRepository.findAndCount.mockResolvedValue(mockedCountedList);
    await service.getEntityListAgGrid({}, true);
    expect(baseEntityRepository.getManyAndCountAgGrid).toBeCalledWith({});
  });

  it('test getEntityListAgGrid with false count', async () => {
    const mockedList: BaseEntity[] = [new BaseEntity()];
    baseEntityRepository.find.mockResolvedValue(mockedList);
    await service.getEntityListAgGrid({}, false);
    expect(baseEntityRepository.getManyAgGrid).toBeCalledWith({});
  });

  it('test getEntityListAgGrid with relations', async () => {
    const mockedList: BaseEntity[] = [new BaseEntity()];
    baseEntityRepository.find.mockResolvedValue(mockedList);
    await service.getEntityListAgGrid({}, false, ['RelatedEntity']);
    expect(baseEntityRepository.getManyAgGrid).toBeCalledWith({
      relations: ['RelatedEntity'],
    });
  });

  it('test getEntityListAgGrid with specific Database', async () => {
    const testRepository = createMock<AgGridRepository<BaseEntity>>();
    const mockedConnection = createMock<Connection>();
    mockedConnection.getRepository.mockReturnValue(testRepository);
    mockedGetConnection.mockReturnValueOnce(mockedConnection);

    const mockedList: BaseEntity[] = [new BaseEntity()];
    testRepository.find.mockResolvedValue(mockedList);

    // Checks the base repository to be set before changing it
    expect(service.getRepository()).toBe(baseEntityRepository);

    await service.getEntityListAgGrid({}, false, [], 'databaseName');

    expect(mockedConnection.getRepository).toHaveBeenCalledWith(
      baseEntityRepository.target,
    );
    expect(mockedGetConnection).toHaveBeenCalledWith(
      getConnectionName('databaseName'),
    );
    expect(service.getRepository()).toBe(testRepository);
  });
});
