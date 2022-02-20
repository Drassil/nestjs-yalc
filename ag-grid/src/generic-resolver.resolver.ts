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
} from '@nestjs-yalc/ag-grid/ag-grid-args.decorator';

import { applyDecorators, Inject, UseInterceptors } from '@nestjs/common';
import { AgGridInterceptor } from '@nestjs-yalc/ag-grid/ag-grid.interceptor';
import returnValue from '@nestjs-yalc/utils/returnValue';
import {
  IExtraArg,
  AgGridFindManyOptions,
} from '@nestjs-yalc/ag-grid/ag-grid.interface';
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
import { InputArgs } from '@nestjs-yalc/ag-grid/gqlmapper.decorator';
import { isClass } from '@nestjs-yalc/utils/class.helper';
export interface IGenericResolver {
  [index: string]: any; //index signature
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
  /**
   * Filters with direct arguments
   */
  extraArgsStrategy?: ExtraArgsStrategy;
  extraArgs?: {
    [index: string]: IExtraArg;
  };
}

export interface IGenericResolverQueryOptions
  extends IGenericResolverMethodOptions {
  idName?: string;
  throwOnNotFound?: boolean;
}

// export interface ICustomQueryOptions extends IGenericResolverMethodOptions {
//   /**
//    * Filters with direct arguments
//    */
//   extraArgsStrategy?: ExtraArgsStrategy;
//   extraArgs?: {
//     [index: string]: IExtraArg;
//   };
// }

export interface ICustomSingleQueryOptions
  extends IGenericResolverMethodOptions {
  isSingleResource: true;
  throwOnNotFound?: boolean;
  idName?: string;
}

export function isCustomSingleQueryOptions(
  option: IGenericResolverQueryOptions | ICustomSingleQueryOptions,
): option is ICustomSingleQueryOptions {
  return (<ICustomSingleQueryOptions>option).isSingleResource === true;
}

export function hasExtraArgs(option: IGenericResolverQueryOptions): boolean {
  return !!(<IGenericResolverQueryOptions>option).extraArgs;
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
    [index: string]: IGenericResolverQueryOptions | ICustomSingleQueryOptions;
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
    dataLoaderToken?: string;
    /**
     * Override default service (must be based on class GenericService)
     */
    serviceToken?: string;
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
export function defineFieldResolver<Entity extends Record<string, any> = any>(
  resolverInfoList: IRelationInfo[],
  resolver: ClassType<IGenericResolver>,
) {
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
        resolver.prototype,
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

            if (parentRes !== undefined) {
              if (hasFilters(findOptions))
                throw new AgGridError(
                  'Cannot specify join arguments and resolver arguments at the same time',
                );

              return [parentRes, -1];
            }

            const dataLoader: GQLDataLoader<Entity> =
              await this.moduleRef.resolve(
                getDataloaderToken(relType),
                this.contextId,
              );

            const joinCol =
              resolverInfo.join?.referencedColumnName ??
              dataLoader.getSearchKey();

            const parentCol =
              resolverInfo.join?.name ?? dataLoader.getSearchKey();

            return dataLoader.loadOneToMany(
              [joinCol, parent[parentCol]],
              findOptions,
              true,
            );
          },
        },
      );

      const descriptor = Object.getOwnPropertyDescriptor(
        resolver.prototype,
        resolverInfo.relation.propertyName,
      );

      if (!descriptor)
        throw new ReferenceError(
          `GenericResolver.${resolverInfo.relation.propertyName} must have a descriptor`,
        );

      ResolveField(returnValue(AgGridGqlType<Entity>(relType)), {
        nullable: resolverInfo.agField?.gqlOptions?.nullable,
      })(resolver.prototype, resolverInfo.relation.propertyName, descriptor);
      UseInterceptors(new AgGridInterceptor())(
        resolver.prototype,
        resolverInfo.relation.propertyName,
        descriptor,
      );

      Parent()(resolver.prototype, resolverInfo.relation.propertyName, 0);

      AgGridArgs({
        fieldType: relType,
        entityType: relType,
        defaultValue: resolverInfo.agField?.relation?.defaultValue,
      })(resolver.prototype, resolverInfo.relation.propertyName, 1);

      // without the design:paramtypes metadata
      // it won't work, the following instruction is transpiled and generated
      // when the decorators are defined in their standard way.
      Reflect.metadata('design:paramtypes', [Object, Object])(
        resolver.prototype,
        resolverInfo.relation.propertyName,
      );
    } else {
      /**
       * ONE-TO-ONE Resolve Fields
       */

      Object.defineProperty(
        resolver.prototype,
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

            if (parentRes !== undefined) {
              if (hasFilters(findOptions))
                throw new AgGridError(
                  'Cannot specify join arguments and resolver arguments at the same time',
                );

              return parentRes;
            }

            const dataLoader: GQLDataLoader<Entity> =
              await this.moduleRef.resolve(
                getDataloaderToken(relType),
                this.contextId,
              );

            /* istanbul ignore next */
            const joinCol =
              resolverInfo.join?.referencedColumnName ??
              dataLoader.getSearchKey();

            const parentCol =
              resolverInfo.join?.name ?? dataLoader.getSearchKey();
            return dataLoader.loadOne(
              [joinCol, parent[parentCol]],
              findOptions,
              false,
            );
          },
        },
      );

      const descriptor = Object.getOwnPropertyDescriptor(
        resolver.prototype,
        resolverInfo.relation.propertyName,
      );

      if (!descriptor)
        throw new ReferenceError(
          `GenericResolver.${resolverInfo.relation.propertyName} must have a descriptor`,
        );

      ResolveField(returnValue(relType), {
        nullable: resolverInfo.agField?.gqlOptions?.nullable,
      })(resolver.prototype, resolverInfo.relation.propertyName, descriptor);

      Parent()(resolver.prototype, resolverInfo.relation.propertyName, 0);

      AgGridArgsSingle({ fieldType: relType, entityType: relType })(
        resolver.prototype,
        resolverInfo.relation.propertyName,
        1,
      );

      // without the design:paramtypes metadata
      // it won't work, the following instruction is transpiled and generated
      // when the decorators are defined in their standard way.
      Reflect.metadata('design:paramtypes', [Object, Array])(
        resolver.prototype,
        resolverInfo.relation.propertyName,
      );
    }
  }
}
export function defineGetSingleResource<Entity>(
  queryName: string,
  returnType: ClassType,
  resolver: ClassType<IGenericResolver>,
  methodOptions: IGenericResolverQueryOptions,
) {
  Object.defineProperty(resolver.prototype, queryName, {
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
        methodOptions.throwOnNotFound ?? false,
      );
    },
  });

  const descriptor = Object.getOwnPropertyDescriptor(
    resolver.prototype,
    queryName,
  );

  if (!descriptor)
    throw new ReferenceError(
      `${resolver.name}.${queryName} must have a descriptor`,
    );

  applyDecorators(
    ...generateDecorators(
      Query,
      queryName,
      methodOptions.returnType ?? returnValue(returnType),
      methodOptions,
    ),
  )(resolver.prototype, queryName, descriptor);

  const fieldType = methodOptions.returnType?.() ?? returnType;

  const entityType =
    !isClass(fieldType) && typeof fieldType === 'function'
      ? fieldType()
      : fieldType;

  Args(methodOptions.idName ?? 'ID', {
    nullable: false,
    type: returnValue(String),
  })(resolver.prototype, queryName, 0);
  AgGridArgsSingle({
    fieldType,
    entityType,
  })(resolver.prototype, queryName, 1);

  Reflect.metadata('design:paramtypes', [Object, Array])(
    resolver.prototype,
    queryName,
  );
}

export function defineGetGridResource<Entity>(
  queryName: string,
  returnType: ClassType,
  resolver: ClassType<IGenericResolver>,
  methodOptions: IGenericResolverQueryOptions,
) {
  Object.defineProperty(resolver.prototype, queryName, {
    configurable: true,
    writable: true,
    value: async function (
      findOptions: AgGridFindManyOptions,
    ): Promise<[Entity[], number]> {
      return this.service.getEntityListAgGrid(findOptions, true);
    },
  });

  const descriptor = Object.getOwnPropertyDescriptor(
    resolver.prototype,
    queryName,
  );

  if (!descriptor)
    throw new ReferenceError(
      `${resolver.name}.${queryName} must have a descriptor`,
    );

  applyDecorators(
    ...generateDecorators(
      Query,
      queryName,
      methodOptions.returnType ??
        returnValue(AgGridGqlType<Entity>(returnType)),
      methodOptions,
    ),
  )(resolver.prototype, queryName, descriptor);

  UseInterceptors(new AgGridInterceptor())(
    resolver.prototype,
    queryName,
    descriptor,
  );

  const fieldType = methodOptions.returnType?.() ?? returnType;
  const entityType =
    !isClass(fieldType) && typeof fieldType === 'function'
      ? fieldType()
      : fieldType;

  let extraArgTypes: any[] = [];
  if (hasExtraArgs(methodOptions)) {
    AgGridArgs({
      fieldType,
      entityType,
      extraArgs: methodOptions.extraArgs,
      extraArgsStrategy: methodOptions.extraArgsStrategy,
      // type: returnValue(agQueryParamsFactory(methodOptions.defaultValue)),
    })(resolver.prototype, queryName, 0);

    if (methodOptions.extraArgs) {
      extraArgTypes = Object.values(methodOptions.extraArgs).map((a) =>
        filterTypeToNativeType(a.filterType),
      );
    }
  } else {
    AgGridArgs({
      fieldType,
      entityType,
    })(resolver.prototype, queryName, 0);
  }

  Reflect.metadata(
    'design:paramtypes',
    extraArgTypes.length ? [...extraArgTypes, Object] : [Object],
  )(resolver.prototype, queryName);
}

export function defineCreateMutation<Entity>(
  queryName: string,
  returnType: ClassType,
  resolver: ClassType<IGenericResolver>,
  options: IGenericResolverOptions<Entity>,
  methodOptions: IGenericResolverQueryOptions,
) {
  Object.defineProperty(resolver.prototype, queryName, {
    configurable: true,
    writable: true,
    value: async function (
      input: Entity,
      findOptions: AgGridFindManyOptions<Entity>,
    ): Promise<Entity | null> {
      return this.service.createEntity(input, findOptions);
    },
  });

  const descriptor = Object.getOwnPropertyDescriptor(
    resolver.prototype,
    queryName,
  );

  if (!descriptor)
    throw new ReferenceError(
      `${resolver.name}.${queryName} must have a descriptor`,
    );

  applyDecorators(
    ...generateDecorators(
      Mutation,
      queryName,
      methodOptions.returnType ?? returnValue(returnType),
      methodOptions,
    ),
  )(resolver.prototype, queryName, descriptor);

  InputArgs({
    gql: {
      type:
        /* istanbul ignore next */
        () => options.input?.create ?? returnType,
    },
    fieldType: options.input?.create ?? returnType,
    _name: 'input',
  })(resolver.prototype, queryName, 0);

  const fieldType = methodOptions.returnType?.() ?? returnType;
  const entityType =
    !isClass(fieldType) && typeof fieldType === 'function'
      ? fieldType()
      : fieldType;

  AgGridArgsSingle({
    fieldType,
    entityType,
  })(resolver.prototype, queryName, 1);

  Reflect.metadata('design:paramtypes', [Object])(
    resolver.prototype,
    queryName,
  );
}

export function defineUpdateMutation<Entity>(
  queryName: string,
  returnType: ClassType,
  resolver: ClassType<IGenericResolver>,
  options: IGenericResolverOptions<Entity>,
  methodOptions: IGenericResolverQueryOptions,
) {
  Object.defineProperty(resolver.prototype, queryName, {
    configurable: true,
    writable: true,
    value: async function (
      conditions: Entity,
      input: Entity,
      findOptions: AgGridFindManyOptions<Entity>,
    ): Promise<Entity | null> {
      return this.service.updateEntity(conditions, input, findOptions);
    },
  });

  const descriptor = Object.getOwnPropertyDescriptor(
    resolver.prototype,
    queryName,
  );

  if (!descriptor)
    throw new ReferenceError(
      `${resolver.name}.${queryName} must have a descriptor`,
    );

  applyDecorators(
    ...generateDecorators(
      Mutation,
      `${options.prefix ?? ''}update${options.entityModel.name}`,
      methodOptions.returnType ?? returnValue(returnType),
      methodOptions,
    ),
  )(resolver.prototype, queryName, descriptor);

  InputArgs({
    fieldType: options.input?.conditions ?? returnType,
    gql: {
      type:
        /* istanbul ignore next */
        () => options.input?.conditions ?? returnType,
    },
    _name: 'conditions',
  })(resolver.prototype, queryName, 0);

  InputArgs({
    fieldType: options.input?.update ?? returnType,
    gql: {
      type:
        /* istanbul ignore next */
        () => options.input?.update ?? returnType,
    },
    _name: 'input',
  })(resolver.prototype, queryName, 1);

  const fieldType = methodOptions.returnType?.() ?? returnType;
  const entityType =
    !isClass(fieldType) && typeof fieldType === 'function'
      ? fieldType()
      : fieldType;

  AgGridArgsSingle({
    fieldType,
    entityType,
  })(resolver.prototype, queryName, 2);

  Reflect.metadata('design:paramtypes', [Object, Object])(
    resolver.prototype,
    queryName,
  );
}

export function defineDeleteMutation<Entity>(
  queryName: string,
  returnType: ClassType,
  resolver: ClassType<IGenericResolver>,
  options: IGenericResolverOptions<Entity>,
  methodOptions: IGenericResolverQueryOptions,
) {
  Object.defineProperty(resolver.prototype, queryName, {
    configurable: true,
    writable: true,
    value: async function (conditions: Entity): Promise<boolean> {
      return this.service.deleteEntity(conditions);
    },
  });

  const descriptor = Object.getOwnPropertyDescriptor(
    resolver.prototype,
    queryName,
  );

  if (!descriptor)
    throw new ReferenceError(
      `${resolver.name}.${queryName} must have a descriptor`,
    );

  applyDecorators(
    ...generateDecorators(
      Mutation,
      queryName,
      returnValue(Boolean),
      methodOptions,
    ),
  )(resolver.prototype, queryName, descriptor);

  InputArgs({
    fieldType: options.input?.conditions ?? returnType,
    gql: {
      type:
        /* istanbul ignore next */
        () => options.input?.conditions ?? returnType,
    },
    _name: 'conditions',
  })(resolver.prototype, queryName, 0);

  Reflect.metadata('design:paramtypes', [Object])(
    resolver.prototype,
    queryName,
  );
}

export function resolverFactory<
  Entity extends Record<string, any> = any,
  EntityWrite = Entity,
>(
  options: IGenericResolverOptions<Entity>,
): {
  new (
    service: GenericService<Entity, EntityWrite>,
    dataloader: GQLDataLoader<Entity>,
    moduleRef: ModuleRef,
  ): IGenericResolver;
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
      protected service: GenericService<Entity, EntityWrite>,
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

  const fieldMetadataList = getAgGridFieldMetadataList(returnType);
  if (fieldMetadataList) {
    Object.keys(fieldMetadataList).forEach((propertyName) => {
      const field = fieldMetadataList[propertyName];
      if (!field.relation) return;

      const objIndex = resolverInfoList.findIndex((obj) => {
        if (obj.join) {
          return obj.join.propertyName === propertyName;
        } else {
          return;
        }
      });

      // if already exists override (dataloader options take priority)
      if (objIndex >= 0) {
        const relInfo = resolverInfoList[objIndex];

        const target = field.relation.targetKey.alias;

        resolverInfoList[objIndex] = {
          ...relInfo,
          join: {
            ...relInfo.join,
            propertyName,
            name: field.relation.sourceKey.alias,
            target,
            referencedColumnName: target,
          },
          relation: {
            ...relInfo.relation,
            propertyName,
            relationType: field.relation.relationType,
            type: field.relation.type,
            target: options.entityModel,
          },
          agField: {
            ...relInfo.agField,
            ...field,
          },
        };
      } else {
        const target = field.relation.targetKey.alias;

        const dataLoaderRelation: IRelationInfo = {
          join: {
            propertyName,
            name: field.relation.sourceKey.alias,
            target,
            referencedColumnName: target,
          },
          relation: {
            propertyName,
            relationType: field.relation.relationType,
            type: field.relation.type,
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
  const deleteOptions = options.mutations?.deleteResource ?? {};

  @Resolver(returnValue(returnType), {
    isAbstract: true,
  })
  class Mutations extends BaseClass {}

  defineCreateMutation(
    `${options.prefix ?? ''}create${options.entityModel.name}`,
    returnType,
    Mutations,
    options,
    createOptions,
  );

  defineUpdateMutation(
    `${options.prefix ?? ''}update${options.entityModel.name}`,
    returnType,
    Mutations,
    options,
    updateOptions,
  );

  defineDeleteMutation(
    `${options.prefix ?? ''}delete${options.entityModel.name}`,
    returnType,
    Mutations,
    options,
    deleteOptions,
  );

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
    implements IGenericResolver {}

  defineGetSingleResource(
    `${options.prefix ?? ''}get${options.entityModel.name}`,
    returnType,
    GenericResolver,
    getResourceOptions,
  );

  defineGetGridResource(
    `${options.prefix ?? ''}get${options.entityModel.name}Grid`,
    returnType,
    GenericResolver,
    getResourceGridOptions,
  );

  /**
   *
   * Generate Field Resolvers
   *
   */

  defineFieldResolver(resolverInfoList, GenericResolver);
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
        defineGetSingleResource(
          queryName,
          returnType,
          GenericResolver,
          queryOptions,
        );
      } else {
        defineGetGridResource(
          queryName,
          returnType,
          GenericResolver,
          queryOptions,
        );
      }
    }
  }

  return GenericResolver;
}
