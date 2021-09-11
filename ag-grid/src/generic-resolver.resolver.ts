import {
  Args,
  MutationOptions,
  Parent,
  Query,
  QueryOptions,
  ResolveField,
  Resolver,
  ReturnTypeFunc,
} from '@nestjs/graphql';
import {
  AgGridArgs,
  AgGridArgsSingle,
  IExtraArg,
} from '@nestjs-yalc/ag-grid/ag-grid-args.decorator';
import { applyDecorators, Inject, UseInterceptors } from '@nestjs/common';
import { AgGridInterceptor } from '@nestjs-yalc/ag-grid/ag-grid.interceptor';
import returnValue from '@nestjs-yalc/utils/returnValue';
import { AgGridFindManyOptions } from '@nestjs-yalc/ag-grid/ag-grid.interface';
import {
  GenericService,
  getServiceToken,
} from '@nestjs-yalc/ag-grid/generic-service.service';
import { IDecoratorType, IFieldMapper } from '@nestjs-yalc/interfaces';
import AgGridGqlType from './ag-grid.type';
import {
  getDataloaderToken,
  GQLDataLoader,
} from '@nestjs-yalc/data-loader/dataloader.helper';
import { ContextId, ContextIdFactory, ModuleRef } from '@nestjs/core';
import { Mutation } from '@nestjs/graphql';
import { ClassType } from '@nestjs-yalc/types';
import {
  filterTypeToNativeType,
  getEntityRelations,
  IRelationInfo,
} from './ag-grid.helpers';
import { getAgGridFieldMetadataList } from './object.decorator';
import { AgGridError } from './ag-grid.error';
import { ExtraArgsStrategy } from './ag-grid.enum';
import { IAgQueryParams } from './ag-grid.args';
import { InputArgs } from '@nestjs-yalc/graphql/decorators/gqlmapper.decorator';
export interface IGenericResolver<Entity> {
  [index: string]: any; //index signature
  getResource: {
    (id: string, findOptions: AgGridFindManyOptions): Promise<Entity | null>;
  };
  getResourceGrid: {
    (findOptions: AgGridFindManyOptions): Promise<[Entity[], number]>;
  };
}

export interface IGenericResolverMethodOptions {
  disabled?: boolean;
  queryParams?: QueryOptions | MutationOptions;
  returnType?: ReturnTypeFunc;
  /**
   * @deprecated please use the property decorator alternative instead
   */
  fieldMap?: IFieldMapper;
  decorators?: IDecoratorType[];
  defaultValue?: IAgQueryParams | any;
}

export interface IGenericResolverQueryOptions
  extends IGenericResolverMethodOptions {
  idName?: string;
  throwOnNotFound?: boolean;
}

export interface ICustomQueryOptions extends IGenericResolverMethodOptions {
  /**
   * Filters with direct arguments
   */
  extraArgsStrategy?: ExtraArgsStrategy;
  extraArgs?: {
    [index: string]: IExtraArg;
  };
}

export interface ICustomSingleQueryOptions
  extends IGenericResolverMethodOptions {
  isSingleResource: true;
  throwOnNotFound?: boolean;
  idName?: string;
}

export function isCustomSingleQueryOptions(
  option: ICustomQueryOptions | ICustomSingleQueryOptions,
): option is ICustomSingleQueryOptions {
  return (<ICustomSingleQueryOptions>option).isSingleResource === true;
}

export function hasFilters(findOptions: AgGridFindManyOptions) {
  return (
    (findOptions.where &&
      Object.values(findOptions.where.filters).length > 0) ||
    (findOptions.order && Object.values(findOptions.order).length > 0)
  );
}

export interface IGenericResolverOptions<Entity> {
  entityModel: ClassType<Entity>;
  dto?: ClassType;
  input?: {
    create?: ClassType;
    update?: ClassType;
    conditions?: ClassType;
  };
  prefix?: string;
  queries?: {
    getResource?: IGenericResolverQueryOptions;
    getResourceGrid?: IGenericResolverMethodOptions;
  };
  customQueries?: {
    [index: string]: ICustomQueryOptions | ICustomSingleQueryOptions;
  };
  mutations?: {
    createResource: IGenericResolverMethodOptions;
    deleteResource: IGenericResolverMethodOptions;
    updateResource: IGenericResolverMethodOptions;
  };
  /** exclude create/delete/update mutations automatically */
  readonly?: boolean;
  /**
   * Override default service. It requires both service and the related dataloader
   */
  service?: {
    /**
     * Override default dataloader (must be based on class GQLDataLoader)
     */
    dataLoaderToken: string;
    /**
     * Override default service (must be based on class GenericService)
     */
    serviceToken: string;
  };
}

export function generateDecorators(
  methodFn: typeof Query | typeof Mutation,
  defaultName: string,
  typeFunc: ReturnTypeFunc,
  options?: IGenericResolverMethodOptions,
) {
  if (options?.disabled) return [];

  return [
    ...(options?.decorators ?? []),
    methodFn(typeFunc, {
      ...options?.queryParams,
      name: options?.queryParams?.name ?? defaultName,
    }),
  ];
}

export function resolverFactory<Entity extends Record<string, any> = any>(
  options: IGenericResolverOptions<Entity>,
): {
  new (
    service: GenericService<Entity>,
    dataloader: GQLDataLoader<Entity>,
    moduleRef: ModuleRef,
  ): IGenericResolver<Entity>;
} {
  const returnType = options.dto ?? options.entityModel;

  @Resolver(returnValue(returnType), { isAbstract: true })
  abstract class BaseClass {
    [index: string]: any; //index signature to allow dynamic properties

    contextId: ContextId;

    constructor(
      @Inject(
        options.service?.serviceToken ?? getServiceToken(options.entityModel),
      )
      protected service: GenericService<Entity>,
      @Inject(
        options.service?.dataLoaderToken ??
          getDataloaderToken(options.entityModel),
      )
      protected dataLoader: GQLDataLoader<Entity>,
      protected moduleRef: ModuleRef,
    ) {
      this.contextId = ContextIdFactory.create();
      this.moduleRef;
    }
  }

  /**
   *
   * Retrieve information about relations
   *
   */
  const resolverInfoList: IRelationInfo[] = getEntityRelations(
    options.entityModel,
    options.dto,
  );

  const fieldMetadataList = getAgGridFieldMetadataList(options.entityModel);
  if (fieldMetadataList) {
    Object.keys(fieldMetadataList).forEach((propertyName) => {
      const field = fieldMetadataList[propertyName];
      if (!field.dataLoader) return;

      const objIndex = resolverInfoList.findIndex(
        (obj) => obj.join?.propertyName === propertyName,
      );

      // if already exists override (dataloader options take priority)
      if (objIndex >= 0) {
        const relInfo = resolverInfoList[objIndex];

        resolverInfoList[objIndex] = {
          ...relInfo,
          join: {
            ...relInfo.join,
            propertyName,
            target: field.dataLoader.searchKey,
          },
          relation: {
            ...relInfo.relation,
            propertyName,
            relationType: field.dataLoader.relationType,
            type: field.dataLoader.type,
            target: options.entityModel,
          },
          agField: {
            ...relInfo.agField,
            ...field,
          },
        };
      } else {
        const dataLoaderRelation: IRelationInfo = {
          join: {
            propertyName,
            target: field.dataLoader.searchKey,
          },
          relation: {
            propertyName,
            relationType: field.dataLoader.relationType,
            type: field.dataLoader.type,
            isLazy: true,
            target: options.entityModel,
            options: {},
          },
          agField: field,
        };
        resolverInfoList.push(dataLoaderRelation);
      }
    });
  }

  /**
   *
   * Generate Mutations
   *
   */
  const createOptions = options.mutations?.createResource ?? {};
  const updateOptions = options.mutations?.updateResource ?? {};

  @Resolver(returnValue(returnType), {
    isAbstract: true,
  })
  abstract class Mutations extends BaseClass {
    @applyDecorators(
      ...generateDecorators(
        Mutation,
        `${options.prefix}create${options.entityModel.name}`,
        createOptions.returnType ?? returnValue(returnType),
        createOptions,
      ),
    )
    public async createResource(
      @InputArgs({
        gql: {
          type: () => options.input?.create ?? returnType,
        },
        fieldType: options.input?.create ?? returnType,
        _name: 'input',
      })
      input: Entity,
    ): Promise<Entity | null> {
      return this.service.createEntity(input);
    }

    @applyDecorators(
      ...generateDecorators(
        Mutation,
        `${options.prefix}update${options.entityModel.name}`,
        updateOptions.returnType ?? returnValue(returnType),
        updateOptions,
      ),
    )
    public async updateResource(
      @InputArgs({
        fieldType: options.input?.conditions ?? returnType,
        gql: {
          type: () => options.input?.conditions ?? returnType,
        },
        _name: 'conditions',
      })
      conditions: Entity,
      @InputArgs({
        fieldType: options.input?.update ?? returnType,
        gql: { type: () => options.input?.update ?? returnType },
        _name: 'input',
      })
      input: Entity,
    ): Promise<Entity | null> {
      return this.service.updateEntity(conditions, input);
    }

    @applyDecorators(
      ...generateDecorators(
        Mutation,
        `${options.prefix}delete${options.entityModel.name}`,
        returnValue(Boolean),
        options.mutations?.deleteResource,
      ),
    )
    public async deleteResource(
      @InputArgs({
        fieldType: options.input?.conditions ?? returnType,
        gql: {
          type: () => Boolean,
        },
        _name: 'conditions',
      })
      conditions: Entity,
    ): Promise<boolean> {
      return this.service.deleteEntity(conditions);
    }
  }

  const getResourceOptions = options.queries?.getResource ?? {};
  const getResourceGridOptions = options.queries?.getResourceGrid ?? {};

  /**
   *
   * Generate Queries
   *
   */
  @Resolver(returnValue(returnType))
  class GenericResolver
    extends (options.readonly ? BaseClass : Mutations)
    implements IGenericResolver<Entity> {
    @applyDecorators(
      ...generateDecorators(
        Query,
        `${options.prefix}get${options.entityModel.name}`,
        getResourceOptions.returnType ?? returnValue(returnType),
        getResourceOptions,
      ),
    )
    public async getResource(
      @Args(getResourceOptions.idName ?? 'ID') id: string,
      @AgGridArgsSingle({
        fieldType: getResourceOptions.returnType?.() ?? returnType,
        entityType: options.entityModel,
      })
      findOptions: AgGridFindManyOptions<Entity>,
    ): Promise<Entity | null> {
      // we use the dataloader instead of the service directly
      // in order to cache data and to run a single query
      return this.dataLoader.loadOne(
        [this.dataLoader.getSearchKey(), id],
        findOptions,
        getResourceOptions.throwOnNotFound === true ?? false,
      );
    }

    @applyDecorators(
      ...generateDecorators(
        Query,
        `${options.prefix}get${options.entityModel.name}Grid`,
        getResourceGridOptions.returnType ??
          returnValue(AgGridGqlType<Entity>(returnType)),
        getResourceGridOptions,
      ),
    )
    @UseInterceptors(new AgGridInterceptor())
    public async getResourceGrid(
      @AgGridArgs({
        fieldType: getResourceGridOptions.returnType?.() ?? returnType,
        entityType: options.entityModel,
      })
      findOptions: AgGridFindManyOptions,
    ): Promise<[Entity[], number]> {
      return this.service.getEntityListAgGrid(findOptions, true);
    }
  }

  /**
   *
   * Generate Field Resolvers
   *
   */
  for (const resolverInfo of resolverInfoList) {
    const relType =
      resolverInfo.agField?.gqlType?.() ??
      (typeof resolverInfo.relation.type === 'function'
        ? resolverInfo.relation.type()
        : resolverInfo.relation.type);

    if (
      resolverInfo.relation.relationType === 'one-to-many' ||
      resolverInfo.relation.relationType === 'many-to-many'
    ) {
      Object.defineProperty(
        GenericResolver.prototype,
        resolverInfo.relation.propertyName,
        {
          configurable: true,
          enumerable: true,
          writable: true,
          value: async function (
            parent: Entity,
            findOptions: AgGridFindManyOptions,
          ): Promise<[Array<Entity | null>, number]> {
            const parentRes = parent[resolverInfo.relation.propertyName];

            if (parentRes) {
              if (hasFilters(findOptions))
                throw new AgGridError(
                  'Cannot specify join arguments and resolver arguments at the same time',
                );

              return [parentRes, -1];
            }

            const dataLoader: GQLDataLoader<Entity> = await this.moduleRef.resolve(
              getDataloaderToken(relType),
              this.contextId,
            );

            const joinCol =
              resolverInfo?.join?.referencedColumnName ??
              dataLoader.getSearchKey();

            return dataLoader.loadOneToMany(
              [joinCol, parent[joinCol]],
              findOptions,
              true,
            );
          },
        },
      );

      const descriptor = Object.getOwnPropertyDescriptor(
        GenericResolver.prototype,
        resolverInfo.relation.propertyName,
      );

      if (!descriptor)
        throw new ReferenceError(
          `GenericResolver.${resolverInfo.relation.propertyName} must have a descriptor`,
        );

      ResolveField(returnValue(AgGridGqlType<Entity>(relType)), {
        nullable: resolverInfo.agField?.gqlOptions?.nullable,
      })(
        GenericResolver.prototype,
        resolverInfo.relation.propertyName,
        descriptor,
      );
      UseInterceptors(new AgGridInterceptor())(
        GenericResolver.prototype,
        resolverInfo.relation.propertyName,
        descriptor,
      );

      Parent()(
        GenericResolver.prototype,
        resolverInfo.relation.propertyName,
        0,
      );

      AgGridArgs({
        fieldType: relType,
        entityType: relType,
        defaultValue: resolverInfo.agField?.dataLoader?.defaultValue,
      })(GenericResolver.prototype, resolverInfo.relation.propertyName, 1);

      // without the design:paramtypes metadata
      // it won't work, the following instruction is transpiled and generated
      // when the decorators are defined in their standard way.
      Reflect.metadata('design:paramtypes', [Object, Object])(
        GenericResolver.prototype,
        resolverInfo.relation.propertyName,
      );
    } else {
      /**
       * ONE-TO-ONE Resolve Fields
       */

      Object.defineProperty(
        GenericResolver.prototype,
        resolverInfo.relation.propertyName,
        {
          configurable: true,
          enumerable: true,
          writable: true,
          value: async function (
            parent: Entity,
            findOptions: AgGridFindManyOptions,
          ): Promise<Entity | null> {
            const parentRes = parent[resolverInfo.relation.propertyName];

            if (parentRes) {
              if (hasFilters(findOptions))
                throw new AgGridError(
                  'Cannot specify join arguments and resolver arguments at the same time',
                );

              return parentRes;
            }

            const dataLoader: GQLDataLoader<Entity> = await this.moduleRef.resolve(
              getDataloaderToken(relType),
              this.contextId,
            );

            const joinCol =
              resolverInfo?.join?.referencedColumnName ??
              dataLoader.getSearchKey();

            return dataLoader.loadOne(
              [joinCol, parent[joinCol]],
              findOptions,
              false,
            );
          },
        },
      );

      const descriptor = Object.getOwnPropertyDescriptor(
        GenericResolver.prototype,
        resolverInfo.relation.propertyName,
      );

      if (!descriptor)
        throw new ReferenceError(
          `GenericResolver.${resolverInfo.relation.propertyName} must have a descriptor`,
        );

      ResolveField(returnValue(relType), {
        nullable: resolverInfo.agField?.gqlOptions?.nullable,
      })(
        GenericResolver.prototype,
        resolverInfo.relation.propertyName,
        descriptor,
      );

      Parent()(
        GenericResolver.prototype,
        resolverInfo.relation.propertyName,
        0,
      );

      AgGridArgsSingle({ fieldType: relType, entityType: relType })(
        GenericResolver.prototype,
        resolverInfo.relation.propertyName,
        1,
      );

      // without the design:paramtypes metadata
      // it won't work, the following instruction is transpiled and generated
      // when the decorators are defined in their standard way.
      Reflect.metadata('design:paramtypes', [Object, Array])(
        GenericResolver.prototype,
        resolverInfo.relation.propertyName,
      );
    }
  }

  /**
   *
   * Generate dynamic queries
   *
   */

  if (options.customQueries) {
    for (const methodName of Object.keys(options.customQueries)) {
      const queryName = methodName;
      const queryOptions = options.customQueries[methodName];

      if (isCustomSingleQueryOptions(queryOptions)) {
        Object.defineProperty(GenericResolver.prototype, queryName, {
          configurable: true,
          writable: true,
          value: async function (
            id: string,
            findOptions: AgGridFindManyOptions<Entity>,
          ): Promise<Entity | null> {
            const dataLoader: GQLDataLoader<Entity> = this.dataLoader;

            return dataLoader.loadOne(
              [dataLoader.getSearchKey(), id],
              findOptions,
              queryOptions.throwOnNotFound ?? false,
            );
          },
        });

        const descriptor = Object.getOwnPropertyDescriptor(
          GenericResolver.prototype,
          queryName,
        );

        if (!descriptor)
          throw new ReferenceError(
            `GenericResolver.${queryName} must have a descriptor`,
          );

        applyDecorators(
          ...generateDecorators(
            Query,
            `${options.prefix}${queryName}`,
            queryOptions.returnType ?? returnValue(returnType),
            queryOptions,
          ),
        )(GenericResolver.prototype, queryName, descriptor);

        Args(queryOptions.idName ?? 'ID', { type: () => String })(
          GenericResolver.prototype,
          queryName,
          0,
        );
        AgGridArgsSingle({
          fieldType: queryOptions.returnType?.() ?? returnType,
          entityType: options.entityModel,
        })(GenericResolver.prototype, queryName, 1);

        Reflect.metadata('design:paramtypes', [Object, Array])(
          GenericResolver.prototype,
          queryName,
        );
      } else {
        Object.defineProperty(GenericResolver.prototype, queryName, {
          configurable: true,
          writable: true,
          value: async function (
            findOptions: AgGridFindManyOptions,
          ): Promise<[Entity[], number]> {
            return this.service.getEntityListAgGrid(findOptions, true);
          },
        });

        const descriptor = Object.getOwnPropertyDescriptor(
          GenericResolver.prototype,
          queryName,
        );

        if (!descriptor)
          throw new ReferenceError(
            `GenericResolver.${queryName} must have a descriptor`,
          );

        applyDecorators(
          ...generateDecorators(
            Query,
            `${options.prefix}${queryName}`,
            queryOptions.returnType ??
              returnValue(AgGridGqlType<Entity>(returnType)),
            queryOptions,
          ),
        )(GenericResolver.prototype, queryName, descriptor);
        UseInterceptors(new AgGridInterceptor())(
          GenericResolver.prototype,
          queryName,
          descriptor,
        );

        AgGridArgs({
          fieldType: queryOptions.returnType?.() ?? returnType,
          extraArgs: queryOptions.extraArgs,
          extraArgsStrategy: queryOptions.extraArgsStrategy,
          // type: returnValue(agQueryParamsFactory(queryOptions.defaultValue)),
        })(GenericResolver.prototype, queryName, 0);

        let extraArgTypes: any = [];
        if (queryOptions.extraArgs) {
          extraArgTypes = Object.values(queryOptions.extraArgs).map((a) =>
            filterTypeToNativeType(a.filterType),
          );
        }

        Reflect.metadata('design:paramtypes', [...extraArgTypes, Object])(
          GenericResolver.prototype,
          queryName,
        );
      }
    }
  }

  return GenericResolver;
}
