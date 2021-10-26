import { createMock } from '@golevelup/ts-jest';
import { GQLDataLoader } from '@nestjs-yalc/data-loader/dataloader.helper';
import { ModuleRef } from '@nestjs/core';
import {
  defineCreateMutation,
  defineDeleteMutation,
  defineGetGridResource,
  defineGetSingleResource,
  defineUpdateMutation,
  IGenericResolver,
  IGenericResolverOptions,
  resolverFactory,
} from '../generic-resolver.resolver';

import { GenericService } from '../generic-service.service';
import {
  TestEntityRelation,
  TestEntityRelation2,
} from '../__mocks__/entity.mock';
import * as AgGridObjectDecorator from '../object.decorator';
import { IAgGridFieldMetadata } from '../object.decorator';
import { BaseEntity } from 'typeorm';
import { AgGridFindManyOptions } from '../ag-grid.interface';
import { FilterType } from '../ag-grid.enum';

class TestEntityDto extends TestEntityRelation {}
class TestEntityInput extends TestEntityDto {}

const propertyRelationName = 'TestEntityRelation2';
const prefix = 'ManageEntity_';
const entityName = 'TestEntityRelation';

const queriesName = {
  getSingleResource: `${prefix}get${entityName}`,
  getGridResource: `${prefix}get${entityName}Grid`,
  create: `${prefix}create${entityName}`,
  update: `${prefix}update${entityName}`,
  delete: `${prefix}delete${entityName}`,
};

const fixedMetadataList: { [key: string]: IAgGridFieldMetadata } = {
  [propertyRelationName]: {
    dst: propertyRelationName,
    src: propertyRelationName,
    dataLoader: {
      searchKey: propertyRelationName,
      relationType: 'one-to-many',
      type: () => TestEntityRelation2,
    },
    gqlType: () => TestEntityDto,
  },
};

const baseResolverOption: IGenericResolverOptions<TestEntityRelation> = {
  entityModel: TestEntityRelation,
  dto: TestEntityDto,
  prefix: 'ManageEntity_',
  input: {
    create: TestEntityInput,
    conditions: TestEntityInput,
    update: TestEntityInput,
  },
  service: {
    serviceToken: 'TestEntityGenericService',
    dataLoaderToken: 'TestEntityDataLoader',
  },
  queries: {
    getResource: {},
    getResourceGrid: {},
  },
  mutations: {
    createResource: {},
    updateResource: {},
    deleteResource: {},
  },
  //readonly: true,
};

describe('Generic Resolver', () => {
  const mockedGenericService = createMock<GenericService<TestEntityRelation>>();
  const mockedTestEntityRelationDL =
    createMock<GQLDataLoader<TestEntityRelation>>();
  const mockedTestEntityRelation2DL =
    createMock<GQLDataLoader<TestEntityRelation2>>();
  const mockedModuleRef = createMock<ModuleRef>();

  const spiedAgGridMetaDataList = jest.spyOn(
    AgGridObjectDecorator,
    'getAgGridFieldMetadataList',
  );

  const generateResolver = (mockedMetadataList, resolverOption) => {
    spiedAgGridMetaDataList.mockReturnValue(mockedMetadataList);
    const ResolverClass = resolverFactory<TestEntityRelation>(resolverOption);

    const resolver: IGenericResolver = new ResolverClass(
      mockedGenericService,
      mockedTestEntityRelationDL,
      mockedModuleRef,
    );
    return resolver;
  };

  const getQueriesFromResolver = (resolver) => {
    return {
      getSingleRes: () => resolver[queriesName.getSingleResource]('id', {}),
      getGridResource: () => resolver[queriesName.getGridResource]({}),
      create: () => resolver[queriesName.create](TestEntityRelation),
      update: () =>
        resolver[queriesName.update](TestEntityRelation, TestEntityRelation),
      delete: () => resolver[queriesName.delete]('id', {}),
    };
  };

  beforeEach(() => {
    mockedModuleRef.resolve.mockResolvedValue(mockedTestEntityRelation2DL);
    mockedTestEntityRelation2DL.loadOneToMany.mockResolvedValue([
      [new TestEntityRelation2()],
      1,
    ]);

    mockedModuleRef.resolve.mockResolvedValue(mockedTestEntityRelation2DL);
    mockedTestEntityRelation2DL.loadOne.mockResolvedValue(
      new TestEntityRelation2(),
    );

    mockedTestEntityRelationDL.loadOne.mockResolvedValue(
      new TestEntityRelation(),
    );
    mockedTestEntityRelationDL.loadOneToMany.mockResolvedValue([
      [new TestEntityRelation()],
      1,
    ]);
    mockedGenericService.createEntity.mockResolvedValue(
      new TestEntityRelation(),
    );

    mockedGenericService.getEntityListAgGrid.mockResolvedValue([
      [new TestEntityRelation()],
      1,
    ]);
    mockedGenericService.updateEntity.mockResolvedValue(
      new TestEntityRelation(),
    );
    mockedGenericService.deleteEntity.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Should create a resolver with a proper execution of the queries', async () => {
    const resolver = generateResolver(fixedMetadataList, baseResolverOption);
    expect(resolver).toBeDefined();
    const queries = getQueriesFromResolver(resolver);
    expect(await queries.getSingleRes()).toBeInstanceOf(TestEntityRelation);
    expect((await queries.getGridResource())[0][0]).toBeInstanceOf(
      TestEntityRelation,
    );
    expect(await queries.create()).toBeInstanceOf(TestEntityRelation);
    expect(await queries.update()).toBeInstanceOf(TestEntityRelation);
    expect(await queries.delete()).toBe(true);
  });

  it('Should create a resolver with the default options', () => {
    const defaultResolverOption: IGenericResolverOptions<TestEntityRelation> = {
      ...baseResolverOption,
      dto: undefined,
      service: undefined,
      mutations: undefined,
      queries: undefined,
      input: undefined,
    };

    const resolver = generateResolver(undefined, defaultResolverOption);
    expect(resolver).toBeDefined();
  });

  describe('Check dataloader one-to-many relationship', () => {
    let customMetadatList;

    beforeEach(() => {
      customMetadatList = { ...fixedMetadataList };
      customMetadatList[propertyRelationName].dataLoader.relationType =
        'one-to-many';
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('Should load the entity relationship', async () => {
      const resolver = generateResolver(customMetadatList, baseResolverOption);

      const result = await resolver[propertyRelationName](
        TestEntityRelation2,
        {},
      );

      expect(result[0][0]).toBeInstanceOf(TestEntityRelation2);
    });

    it('Should throw an error with undefined descriptor on the property', () => {
      const spiedGetPropertyDescriptor = jest.spyOn(
        Object,
        'getOwnPropertyDescriptor',
      );
      spiedGetPropertyDescriptor.mockReturnValueOnce(undefined);
      const testFunction = () =>
        generateResolver(customMetadatList, baseResolverOption);
      expect(testFunction).toThrowError();

      // Need to restore the original not-mocked implementation
      spiedGetPropertyDescriptor.mockRestore();
    });
  });

  describe('Check dataloader one-to-one relationship', () => {
    let customMetadatList;

    beforeEach(() => {
      customMetadatList = { ...fixedMetadataList };
      customMetadatList[propertyRelationName].dataLoader.relationType =
        'one-to-one';
    });

    it('Should load the entity relationship with a one-to-one relationtypee', async () => {
      const resolver = generateResolver(customMetadatList, baseResolverOption);

      const result = await resolver[propertyRelationName](
        TestEntityRelation2,
        {},
      );
      expect(result).toBeInstanceOf(TestEntityRelation2);
    });

    // it('Should throw an error with undefined descriptor on the property', () => {
    //   const spiedGetPropertyDescriptor = jest.spyOn(
    //     Object,
    //     'getOwnPropertyDescriptor',
    //   );
    //   spiedGetPropertyDescriptor.mockReturnValue(undefined);
    //   const testFunction = () =>
    //     generateResolver(customMetadatList, baseResolverOption);
    //   expect(testFunction).toThrowError();

    //   // Need to restore the original not-mocked implementation
    //   spiedGetPropertyDescriptor.mockRestore();
    // });

    it('Should throw an error if we try to load a resolveField with join and resolver specified', async () => {
      const resolver = generateResolver(customMetadatList, baseResolverOption);
      const customTestEntity = {
        [propertyRelationName]: {},
      };
      const findOptions: AgGridFindManyOptions = {
        where: {
          filters: {
            ['key']: {},
          },
        },
      };
      try {
        await resolver[propertyRelationName](
          customTestEntity as any,
          findOptions,
        );
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Check dataloader many-to-many relationship', () => {
    let customMetadatList;

    beforeEach(() => {
      customMetadatList = { ...fixedMetadataList };
      customMetadatList[propertyRelationName].dataLoader.relationType =
        'many-to-many';
    });

    it('Should load the entity relationship with a many-to-many relationtype', async () => {
      const resolver = generateResolver(customMetadatList, baseResolverOption);

      const result = await resolver[propertyRelationName](
        TestEntityRelation2,
        {},
      );

      expect(result[0][0]).toBeInstanceOf(TestEntityRelation2);
    });

    // it('Should throw an error with undefined descriptor on the property', () => {
    //   const spiedGetPropertyDescriptor = jest.spyOn(
    //     Object,
    //     'getOwnPropertyDescriptor',
    //   );
    //   spiedGetPropertyDescriptor.mockReturnValueOnce(undefined);
    //   const testFunction = () =>
    //     generateResolver(customMetadatList, baseResolverOption);
    //   expect(testFunction).toThrowError();

    //   // Need to restore the original not-mocked implementation
    //   spiedGetPropertyDescriptor.mockRestore();
    // });
    it('Should throw an error if we try to load a resolveField with join and resolver specified', async () => {
      const resolver = generateResolver(customMetadatList, baseResolverOption);
      const customTestEntity = {
        [propertyRelationName]: {},
      };
      const findOptions: AgGridFindManyOptions = {
        where: {
          filters: {
            ['key']: {},
          },
        },
      };
      try {
        await resolver[propertyRelationName](
          customTestEntity as any,
          findOptions,
        );
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
  it('Should not create mutation if it is a read-only resolver', () => {
    const customBaseResolverOption: IGenericResolverOptions<TestEntityRelation> =
      {
        ...baseResolverOption,
        readonly: true,
      };
    const resolver = generateResolver({}, customBaseResolverOption);
    expect(resolver[queriesName.create]).not.toBeDefined();
    expect(resolver[queriesName.delete]).not.toBeDefined();
    expect(resolver[queriesName.update]).not.toBeDefined();
  });

  it('Should create a resolver with custom queries', () => {
    const customBaseResolverOption: IGenericResolverOptions<TestEntityRelation> =
      {
        ...baseResolverOption,
        customQueries: {
          customQuery: {
            isSingleResource: true,
          },
          customQueryGrid: {
            extraArgs: {
              ['date']: {
                filterType: FilterType.DATE,
              } as any,
            },
          },
          customQueryGridNoArgs: {
            extraArgs: undefined,
          },
        },
      };
    const resolver = generateResolver({}, customBaseResolverOption);
    expect(resolver['customQuery']).toBeDefined();
    expect(resolver['customQueryGrid']).toBeDefined();
    expect(resolver['customQueryGridNoArgs']).toBeDefined();
  });

  it('Should throw an error if the queries property has no descriptor', () => {
    const spiedGetPropertyDescriptor = jest.spyOn(
      Object,
      'getOwnPropertyDescriptor',
    );
    spiedAgGridMetaDataList.mockReturnValue({});
    const ResolverClass =
      resolverFactory<TestEntityRelation>(baseResolverOption);

    spiedGetPropertyDescriptor.mockReturnValue(undefined);
    const testFunction = {
      getSingle: () =>
        defineGetSingleResource('', BaseEntity, ResolverClass, {}),
      getGrid: () => defineGetGridResource('', BaseEntity, ResolverClass, {}),
      create: () =>
        defineCreateMutation('', BaseEntity, ResolverClass, {} as any, {}),
      update: () =>
        defineUpdateMutation('', BaseEntity, ResolverClass, {} as any, {}),
      delete: () =>
        defineDeleteMutation('', BaseEntity, ResolverClass, {} as any, {}),
    };

    expect(testFunction.getSingle).toThrowError();
    expect(testFunction.getGrid).toThrowError();
    expect(testFunction.create).toThrowError();
    expect(testFunction.update).toThrowError();
    expect(testFunction.delete).toThrowError();
    spiedGetPropertyDescriptor.mockRestore();
  });
});
