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
import {
  baseEntityRepository as _baseEntityRepository,
  MockedEntity,
  ReadEntity,
  WriteEntity,
} from '../__mocks__/generic-service.mocks';
import { getConnectionName } from '@nestjs-yalc/database/conn.helper';
import { createMock } from '@golevelup/ts-jest';
import { CrudGenRepository } from '@nestjs-yalc/crud-gen/crud-gen.repository';
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
import * as ClassHelper from '@nestjs-yalc/utils/class.helper';
jest.mock('typeorm');

describe('GenericService', () => {
  let service: GenericService<MockedEntity>;
  let mockedGetConnection: any;
  let baseEntityRepository = _baseEntityRepository;

  beforeEach(async () => {
    mockedGetConnection = jest.mocked(getConnection, true);

    // the target property can't be proxied
    // we need to create a new proxy by overriding the
    // target handled
    baseEntityRepository = new Proxy(baseEntityRepository, {
      get(obj, p) {
        if (p === 'target') return MockedEntity;

        return obj[p];
      },
    });

    service = new GenericService(baseEntityRepository);
    baseEntityRepository.metadata.primaryColumns = [{ propertyName: 'xx' }];
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a service with write repository', () => {
    const writeRepo = new CrudGenRepository();
    service = new GenericService(baseEntityRepository, writeRepo);
    expect(service.getRepository() === baseEntityRepository).toBeTruthy();
    expect(service.getRepositoryWrite() === writeRepo).toBeTruthy();
  });

  it('should set all repositories correctly', () => {
    const writeRepo = new CrudGenRepository();
    service.setRepository(writeRepo);
    expect(service.getRepository() === writeRepo).toBeTruthy();
    expect(service.getRepositoryWrite() === writeRepo).toBeTruthy();
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

  it('should call the factory function properly with parameters', () => {
    const spiedGenerciService = jest
      .spyOn(GenericServiceModule, 'GenericService')
      .mockImplementation(jest.fn());

    const result: FactoryProvider = GenericServiceFactory<BaseEntity>(
      () => BaseEntity,
      'fakeConnection',
      GenericService,
      MockedEntity,
      'fakeWriteConnection',
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
    expect(baseEntityRepository.findOne).toBeCalledWith({
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
    testRepository.findOne.mockResolvedValue(mockedEntity);

    // Checks the base repository to be set before changing it
    expect(service.getRepository()).toBe(baseEntityRepository);
    expect(service.getRepositoryWrite()).toBe(baseEntityRepository);

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
    expect(service.getRepositoryWrite()).toBe(testRepository);
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
    const testRepository = createMock<CrudGenRepository<BaseEntity>>();
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
    baseEntityRepository.getOneCrudGen.mockResolvedValueOnce(mockedEntity);
    expect(service.createEntity({})).resolves.toBe(mockedEntity);
  });

  it('Should insert an entity correctly with true', async () => {
    const mockedEntity = new BaseEntity();
    const insertResult = new InsertResult();
    insertResult.identifiers = [{ id: '123' }];

    baseEntityRepository.insert.mockResolvedValueOnce(insertResult);
    baseEntityRepository.getOneCrudGen.mockResolvedValueOnce(mockedEntity);
    const result = await service.createEntity({}, {}, false);
    expect(result).toBe(true);
    baseEntityRepository.insert.mockRestore();
    baseEntityRepository.getOneCrudGen.mockRestore();
  });

  it('Should insert an entity correctly when entity isClass', async () => {
    const mockedEntity = new BaseEntity();
    const insertResult = new InsertResult();
    insertResult.identifiers = [{ id: '123' }];
    const mockedIsClass = jest
      .spyOn(ClassHelper, 'isClass')
      .mockReturnValue(true);

    baseEntityRepository.insert.mockResolvedValueOnce(insertResult);
    baseEntityRepository.getOneCrudGen.mockResolvedValueOnce(mockedEntity);
    const result = await service.createEntity({});
    expect(result).toBe(mockedEntity);
    mockedIsClass.mockRestore();
  });

  it('should correctly map entities from read to write', () => {
    const writeRepo = new CrudGenRepository();
    writeRepo.target = WriteEntity;

    const readRepo = new CrudGenRepository();
    readRepo.target = ReadEntity;

    const newService = new GenericService<ReadEntity, WriteEntity>(
      readRepo,
      writeRepo,
    );

    const res = newService.mapEntityR2W({
      jsonProperty: 'test',
      noDest: 'test',
      noTransform: '',
    });
    expect(res).toBeDefined();
  });

  it('should correctly map entities from read to write (without mapper)', () => {
    const writeRepo = new CrudGenRepository();
    writeRepo.target = WriteEntity;

    const readRepo = new CrudGenRepository();
    readRepo.target = WriteEntity;

    const newService = new GenericService<WriteEntity, WriteEntity>(
      readRepo,
      writeRepo,
    );

    newService.mapEntityR2W({ data: 'test' });
  });

  it('should not map entities from read to write when there are no classes', () => {
    const writeRepo = new CrudGenRepository();
    writeRepo.target = {};

    const readRepo = new CrudGenRepository();
    readRepo.target = {};

    const newService = new GenericService<WriteEntity, WriteEntity>(
      readRepo,
      writeRepo,
    );

    newService.mapEntityR2W({ data: 'test' });
  });

  it('Should update an entity correctly', async () => {
    const mockedEntity = new BaseEntity();

    baseEntityRepository.find.mockResolvedValueOnce([mockedEntity]);
    baseEntityRepository.update.mockResolvedValueOnce(new UpdateResult());
    baseEntityRepository.getOneCrudGen.mockResolvedValueOnce(mockedEntity);

    const result = await service.updateEntity({}, {});
    expect(result).toBe(mockedEntity);
  });

  it('Should update an entity correctly and return true', async () => {
    const mockedEntity = new BaseEntity();

    baseEntityRepository.find.mockResolvedValueOnce([mockedEntity]);
    baseEntityRepository.update.mockResolvedValueOnce(new UpdateResult());
    baseEntityRepository.getOneCrudGen.mockResolvedValueOnce(mockedEntity);

    await expect(service.updateEntity({}, {}, {}, false)).resolves.toBe(true);
  });

  it('Should update an entity correctly when entity isClass', async () => {
    const mockedEntity = new BaseEntity();
    const mockedIsClass = jest
      .spyOn(ClassHelper, 'isClass')
      .mockReturnValue(true);

    baseEntityRepository.find.mockResolvedValueOnce([mockedEntity]);
    baseEntityRepository.update.mockResolvedValueOnce(new UpdateResult());
    baseEntityRepository.getOneCrudGen.mockResolvedValueOnce(mockedEntity);
    baseEntityRepository.getId.mockReturnValue({ id: 'id' });

    const result = await service.updateEntity({}, {});
    expect(result).toBeDefined();
    mockedIsClass.mockReset();
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

    await expect(async () => service.createEntity({})).rejects.toThrow(
      CreateEntityError,
    );
  });

  it('should handle an update error', async () => {
    baseEntityRepository.find.mockResolvedValueOnce([new BaseEntity()]);
    baseEntityRepository.update.mockRejectedValueOnce(
      new QueryFailedError('', [], ''),
    );

    await expect(async () => service.updateEntity({}, {})).rejects.toThrow(
      UpdateEntityError,
    );
  });

  it('should handle a deletion error', async () => {
    baseEntityRepository.find.mockResolvedValueOnce([new BaseEntity()]);
    baseEntityRepository.delete.mockRejectedValueOnce(
      new QueryFailedError('', [], ''),
    );

    await expect(async () => service.deleteEntity({})).rejects.toThrow(
      DeleteEntityError,
    );
  });

  it('should not handle a differnt kind of error', async () => {
    jest.spyOn(service, 'validateConditions').mockImplementation(jest.fn());
    baseEntityRepository.delete.mockRejectedValueOnce(
      new ConnectionNotFoundError('Another Error'),
    );

    await expect(async () => service.deleteEntity({})).rejects.toEqual({});
  });

  it('Tests the conditions validation checks is empty', async () => {
    baseEntityRepository.find.mockResolvedValueOnce([]);

    await expect(async () => service.validateConditions({})).rejects.toThrow(
      NoResultsFoundError,
    );
  });

  it('Checks if the validation works when the conditions return too many results', async () => {
    baseEntityRepository.find.mockResolvedValueOnce([
      new BaseEntity(),
      new BaseEntity(),
    ]);

    await expect(async () => service.validateConditions({})).rejects.toThrow(
      ConditionsTooBroadError,
    );
  });
  it('test getEntityListCrudGen', async () => {
    const mockedList: BaseEntity[] = [new BaseEntity()];
    baseEntityRepository.find.mockResolvedValue(mockedList);
    const entityListCrudGen = await service.getEntityListCrudGen({});
    expect(entityListCrudGen).toBeDefined();
  });

  it('test getEntityListCrudGen with count', async () => {
    const mockedCountedList: [BaseEntity[], number] = [[new BaseEntity()], 1];
    baseEntityRepository.findAndCount.mockResolvedValue(mockedCountedList);
    await service.getEntityListCrudGen({}, true);
    expect(baseEntityRepository.getManyAndCountCrudGen).toBeCalledWith({});
  });

  it('test getEntityListCrudGen with false count', async () => {
    const mockedList: BaseEntity[] = [new BaseEntity()];
    baseEntityRepository.find.mockResolvedValue(mockedList);
    await service.getEntityListCrudGen({}, false);
    expect(baseEntityRepository.getManyCrudGen).toBeCalledWith({});
  });

  it('test getEntityListCrudGen with relations', async () => {
    const mockedList: BaseEntity[] = [new BaseEntity()];
    baseEntityRepository.find.mockResolvedValue(mockedList);
    await service.getEntityListCrudGen({}, false, ['RelatedEntity']);
    expect(baseEntityRepository.getManyCrudGen).toBeCalledWith({
      relations: ['RelatedEntity'],
    });
  });

  it('test getEntityListCrudGen with specific Database', async () => {
    const testRepository = createMock<CrudGenRepository<BaseEntity>>();
    const mockedConnection = createMock<Connection>();
    mockedConnection.getRepository.mockReturnValue(testRepository);
    mockedGetConnection.mockReturnValueOnce(mockedConnection);

    const mockedList: BaseEntity[] = [new BaseEntity()];
    testRepository.find.mockResolvedValue(mockedList);

    // Checks the base repository to be set before changing it
    expect(service.getRepository()).toBe(baseEntityRepository);

    await service.getEntityListCrudGen({}, false, [], 'databaseName');

    expect(mockedConnection.getRepository).toHaveBeenCalledWith(
      baseEntityRepository.target,
    );
    expect(mockedGetConnection).toHaveBeenCalledWith(
      getConnectionName('databaseName'),
    );
    expect(service.getRepository()).toBe(testRepository);
  });
});
