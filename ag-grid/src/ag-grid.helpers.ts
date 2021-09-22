import { DataLoaderFactory } from '@nestjs-yalc/data-loader/dataloader.helper';
import { QueryBuilderHelper } from '@nestjs-yalc/database/query-builder.helper';
import {
  IFieldMapper,
  isFieldMapper,
} from '@nestjs-yalc/interfaces/maps.interface';
import { ClassType } from '@nestjs-yalc/types';
import { FactoryProvider, Provider } from '@nestjs/common';
import { ReturnTypeFuncValue } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { Equal, getMetadataArgsStorage, SelectQueryBuilder } from 'typeorm';
import { JoinColumnMetadataArgs } from 'typeorm/metadata-args/JoinColumnMetadataArgs';
import { RelationMetadataArgs } from 'typeorm/metadata-args/RelationMetadataArgs';
import {
  createWhere,
  getFindOperator,
  IExtraArg,
  isCombinedWhereModel,
  isFindOperator,
} from './ag-grid-args.decorator';
import { FilterType, Operators } from './ag-grid.enum';
import {
  AgGridConditionNotSupportedError,
  AgGridNotPossibleError,
  AgGridStringWhereError,
} from './ag-grid.error';
import { JoinArgOptions, JoinTypes } from './ag-grid.input';
import { AgGridFindManyOptions, FilterInput } from './ag-grid.interface';
import {
  AgGridRepository,
  AgGridRepositoryFactory,
} from './ag-grid.repository';
import {
  findOperatorTypes,
  IFilterArg,
  IWhereCondition,
  IWhereConditionType,
  IWhereFilters,
} from './ag-grid.type';
import {
  IGenericResolverOptions,
  resolverFactory,
} from './generic-resolver.resolver';
import { GenericServiceFactory } from './generic-service.service';
import {
  getAgGridFieldMetadataList,
  getAgGridObjectMetadata,
  IAgGridFieldMetadata,
  IFieldAndFilterMapper,
} from './object.decorator';

export const columnConversion = (
  data: IFieldMapper | undefined,
  key: string,
): string => {
  if (data) {
    const dst = data[key]?.dst ?? key;
    return dst;
  }

  return key;
};

export const getFieldMapperSrcByDst = (
  data: IFieldMapper | undefined,
  dst: string,
): string => {
  if (data) {
    for (const src of Object.keys(data)) {
      if (data[src].dst === dst) return src;
    }
  }

  return dst;
};

export const isSymbolic = (
  data: IFieldMapper | undefined,
  key: string,
): boolean => {
  if (data && data[key]) {
    return data[key].isSymbolic ? true : false;
  } else {
    return false;
  }
};

export const forceFilters = (
  where: IWhereCondition | string | undefined,
  properties: IFilterArg[],
  fieldMap: IFieldMapper | undefined,
): IWhereCondition => {
  // typeORM where property can be a string as type but we do not allow to use
  // string with this filter. Should never happen though
  if (typeof where === 'string') {
    throw new AgGridStringWhereError();
  }

  for (const property of properties) {
    if (property.value) {
      where = forceFilterWorker(
        where,
        columnConversion(fieldMap, property.key),
        property.value,
        property.descriptors,
      );
    }
  }

  if (where) {
    return where;
  } else {
    throw new AgGridNotPossibleError();
  }
};

export const forceFilterWorker = (
  where: IWhereCondition | undefined,
  target: string,
  value: findOperatorTypes,
  descriptors?: IExtraArg,
): IWhereCondition => {
  const filter = descriptors
    ? getFindOperator(
        descriptors.filterType,
        descriptors.filterCondition,
        value,
      )
    : Equal(value);

  if (where && where.filters) {
    where.filters[target] = filter;
  } else {
    where = { filters: {} };
    where.filters[target] = filter;
  }

  return where;
};

export function whereObjectToSqlString<Entity>(
  queryBuilder: SelectQueryBuilder<Entity> | undefined,
  where: IWhereCondition,
  alias?: string,
  fieldMap?: {
    parent: IFieldMapper;
    joined: IFieldMapper | { [key: string]: IFieldMapper };
  },
) {
  let sql = '';

  const operator = (where.operator ?? Operators.AND).toUpperCase(); // first level is always AND

  if (Array.isArray(where.childExpressions)) {
    where.childExpressions.forEach((childExpression) => {
      const generatedSql = whereObjectToSqlString(
        queryBuilder,
        childExpression,
        alias,
      );

      if (!generatedSql) return;

      sql += `(${generatedSql}) ${operator} `;
    });
  }

  if (!where.filters) return sql;

  for (const key of Object.keys(where.filters)) {
    const operation: IWhereConditionType = where.filters[key];

    //If we have an operator it means that the filter is combined, or it is a multicolumn
    if ((operation as any).operator !== undefined) {
      //If it is a multicolumn then we convert all internal filters to the multicolumn and enclose the result in round brackets
      if (
        isCombinedWhereModel(operation) &&
        !isCombinedWhereModel(operation.filter_1) &&
        !isCombinedWhereModel(operation.filter_2)
      ) {
        //If instead it is a combined filter then we will convert the first and second filters, enclosing them in brackets and using the operator
        sql += `(${QueryBuilderHelper.computeFindOperatorExpression(
          queryBuilder,
          operation.filter_1,
          QueryBuilderHelper.addAlias(key.toString(), alias, fieldMap),
          operation.filter_1.value,
        )} ${operation.operator.toUpperCase()} ${QueryBuilderHelper.computeFindOperatorExpression(
          queryBuilder,
          operation.filter_2,
          QueryBuilderHelper.addAlias(key.toString(), alias, fieldMap),
          operation.filter_2.value,
        )}) ${operator} `;
      } else {
        /**
         * @todo handle the else (?) but it should not happen
         */
        throw new AgGridConditionNotSupportedError();
      }
    } else if (isFindOperator(operation)) {
      //If it is a normal filter then we simply convert it and add the operator
      sql += `${QueryBuilderHelper.computeFindOperatorExpression(
        queryBuilder,
        operation,
        QueryBuilderHelper.addAlias(key.toString(), alias, fieldMap),
        operation.value,
      )} ${operator} `;
    } else if (typeof operation === 'string') {
      sql += `${QueryBuilderHelper.addAlias(
        key.toString(),
        alias,
        fieldMap,
      )} ${operation} ${operator}`;
    } else {
      throw new AgGridConditionNotSupportedError(JSON.stringify(operation));
    }
  }
  //At the end of the cycle we will have an operator and an excess space, and we remove them
  sql = sql.substring(0, sql.lastIndexOf(operator));
  sql = sql.substring(0, sql.lastIndexOf(' '));
  return sql;
}

export const isAskingForCount = (info: GraphQLResolveInfo): boolean => {
  try {
    return (
      info.fieldNodes?.[0].selectionSet?.selections.some((item: any) => {
        return (
          item.name.value === 'pageData' &&
          item.selectionSet &&
          item.selectionSet.selections.some(
            (subItem: any) => subItem.name.value === 'count',
          )
        );
      }) ?? false
    );
  } catch (e) {
    // quick way to avoid having dozens of conditions to check the info structure
    return false;
  }
};

const objectToFieldMapperCache = new WeakMap();
export const objectToFieldMapper = (
  object:
    | IFieldMapper
    | IFieldAndFilterMapper
    | ReturnTypeFuncValue
    | ClassType,
): IFieldAndFilterMapper => {
  if (typeof object !== 'symbol') {
    const cached = objectToFieldMapperCache.get(object);
    if (cached) {
      return cached;
    }
  }

  let fieldMapper: IFieldAndFilterMapper = { field: {} };

  const objectMetadata = getAgGridObjectMetadata(object as any);

  if (objectMetadata) {
    fieldMapper.filterOption = objectMetadata;

    const fieldMetadataList = getAgGridFieldMetadataList(object as any);

    if (fieldMetadataList) {
      for (const propertyName of Object.keys(fieldMetadataList ?? [])) {
        const fieldMetadata = fieldMetadataList[propertyName];
        const { src, dst, ...fieldMapperProperties } = fieldMetadata;
        if (src) {
          fieldMapper.field[src] = {
            dst: dst ?? src,
            ...fieldMapperProperties,
          };
        }
      }
    }
  } else if (isFieldMapper(object)) {
    fieldMapper.field = object;
  } else if (isIFieldAndFilterMapper(object as any)) {
    fieldMapper = object as IFieldAndFilterMapper;
  } else if (Object.keys(object).length !== 0) {
    throw new TypeError(
      `This object is not compatible with IFieldMapper ${JSON.stringify(
        object,
      )}`,
    );
  }

  if (typeof object !== 'symbol')
    objectToFieldMapperCache.set(object, fieldMapper);

  return fieldMapper;
};

export function isIFieldAndFilterMapper(
  val: IFieldMapper | IFieldAndFilterMapper,
): val is IFieldAndFilterMapper {
  return val?.field !== undefined;
}

export interface IDependencyObject<Entity> {
  providers: Array<FactoryProvider | Provider>;
  repository: ClassType<AgGridRepository<Entity>>;
}

export interface IProviderOverride {
  providerClass: Provider;
}

interface IGeneridServiceOptions<Entity> {
  dbConnection: string;
  entityModel?: ClassType<Entity>;
}

interface IDataLoaderOptions<Entity> {
  databaseKey: keyof Entity;
  entityModel?: ClassType<Entity>;
}

export interface IAgGridDependencyFactoryOptions<Entity> {
  entityModel: ClassType<Entity>;
  resolver?:
    | Omit<IGenericResolverOptions<Entity>, 'entityModel'>
    | IProviderOverride
    | false;
  service?: IGeneridServiceOptions<Entity> | IProviderOverride;
  dataloader?: IDataLoaderOptions<Entity> | IProviderOverride;
  repository?: ClassType<AgGridRepository<Entity>>;
}

export function isProviderOverride(
  resolver: any,
): resolver is IProviderOverride {
  const casted = resolver as IProviderOverride;
  return !!casted.providerClass;
}

export function AgGridDependencyFactory<Entity>({
  entityModel,
  dataloader,
  resolver,
  service,
  repository,
}: IAgGridDependencyFactoryOptions<Entity>): IDependencyObject<Entity> {
  const providers: Provider[] = [];

  const resolverOptions: IGenericResolverOptions<Entity> = {
    ...(resolver ?? {}),
    entityModel,
  };

  let dataLoaderToken, serviceToken;

  if (service) {
    if (isProviderOverride(service)) {
      serviceToken = getProviderToken(service.providerClass);
      providers.push({
        provide: serviceToken,
        useExisting: service.providerClass,
      });
    } else {
      providers.push(
        GenericServiceFactory<Entity>(
          service?.entityModel ?? entityModel,
          service.dbConnection,
        ),
      );
    }
  }

  if (dataloader) {
    if (isProviderOverride(dataloader)) {
      dataLoaderToken = getProviderToken(dataloader.providerClass);
      providers.push({
        provide: dataLoaderToken,
        useExisting: dataloader.providerClass,
      });
    } else {
      providers.push(
        DataLoaderFactory<Entity>(
          dataloader.databaseKey,
          dataloader?.entityModel ?? entityModel,
          serviceToken,
        ),
      );
    }
  }

  if (resolver !== false) {
    if (serviceToken && dataLoaderToken) {
      resolverOptions.service = {
        serviceToken,
        dataLoaderToken,
      };
    } else if (serviceToken || dataLoaderToken) {
      throw new Error(
        'Both service and dataloader providers must be defined when using custom ones',
      );
    }

    providers.push(
      resolver && isProviderOverride(resolver)
        ? resolver.providerClass
        : resolverFactory<Entity>(resolverOptions),
    );
  }

  return {
    providers,
    repository: repository ?? AgGridRepositoryFactory<Entity>(entityModel),
  };
}

export function getProviderToken(entity: ClassType | Provider | string) {
  if (entity && typeof entity === 'object' && entity.provide) {
    typeof entity.provide === 'function'
      ? entity.provide.name
      : entity.provide.toString();
  }

  return typeof entity === 'function' ? entity.name : entity.toString();
}

export function filterTypeToNativeType(type: FilterType) {
  switch (type) {
    case FilterType.TEXT:
      return String;
    case FilterType.DATE:
      return Date;
    case FilterType.NUMBER:
      return Number;
    case FilterType.SET:
      return Array;
  }

  throw new TypeError(
    `Filter type not supported for native conversion: ${FilterType.SET}`,
  );
}

export interface IRelationInfo {
  relation: RelationMetadataArgs;
  join: JoinColumnMetadataArgs | undefined;
  agField?: IAgGridFieldMetadata;
}

export function getEntityRelations<Entity, DTO = Entity>(
  entityModel: ClassType<Entity>,
  dto?: ClassType<DTO>,
): IRelationInfo[] {
  const relations = getMetadataArgsStorage().relations.filter(
    (v) =>
      typeof v.target !== 'string' &&
      (entityModel.prototype instanceof v.target || entityModel === v.target),
  );

  const joinColumns = getMetadataArgsStorage().joinColumns.filter(
    (v) =>
      typeof v.target !== 'string' &&
      (entityModel.prototype instanceof v.target || entityModel === v.target),
  );

  const agGridMetadata = getAgGridFieldMetadataList(dto ?? entityModel);

  return relations.map((r: RelationMetadataArgs) => ({
    relation: r,
    join: joinColumns.find(
      (j: JoinColumnMetadataArgs) => j.propertyName === r.propertyName,
    ),
    agField: agGridMetadata
      ? Object.values(agGridMetadata).find((v) => v.dst === r.propertyName)
      : {},
  }));
}

export function getTypeProperties<Entity>(entityModel: ClassType<Entity>) {
  const columns = getMetadataArgsStorage().columns.filter(
    (v) =>
      typeof v.target !== 'string' &&
      (entityModel.prototype instanceof v.target || entityModel === v.target),
  );

  // to get ag-grid fields
  // const fieldMetadataList = getAgGridFieldMetadataList(entityModel);

  // if (fieldMetadataList) {
  //   for (const propertyName of Object.keys(fieldMetadataList ?? [])) {
  //     const fieldMetadata = fieldMetadataList[propertyName];

  //     if (fieldMetadata.dataLoader) {
  //       // skip dataloaders
  //       continue;
  //     }

  //     columns.push({
  //       propertyName,
  //       target: entityModel,
  //       mode: 'regular',
  //       options: {},
  //     });
  //   }
  // }

  return columns;
}

export function getMappedTypeProperties<Entity>(
  entityModel: ClassType<Entity>,
) {
  const fieldMapper = objectToFieldMapper(entityModel);

  return getTypeProperties(entityModel).reduce((r, v) => {
    const src = getFieldMapperSrcByDst(fieldMapper.field, v.propertyName);

    if (!fieldMapper.field[src]?.denyFilter) r.push(src);
    return r;
  }, new Array<string>());
}

export function applyJoinArguments(
  findManyOptions: AgGridFindManyOptions,
  alias: string,
  join: { [index: string]: JoinArgOptions },
  fieldMapper: IFieldMapper,
): void {
  const _joinObject: {
    alias: string;
    innerJoinAndSelect: { [key: string]: string };
    leftJoinAndSelect: { [key: string]: string };
  } = {
    alias,
    innerJoinAndSelect: {},
    leftJoinAndSelect: {},
  };

  Object.keys(join).forEach((table: string) => {
    const j: JoinArgOptions = join[table];
    switch (j.joinType) {
      case JoinTypes.INNER_JOIN:
        _joinObject.innerJoinAndSelect[table] = `${_joinObject.alias}.${table}`;
        break;
      case JoinTypes.LEFT_JOIN:
      default:
        _joinObject.leftJoinAndSelect[table] = `${_joinObject.alias}.${table}`;
        break;
    }

    if (j.filters) {
      findManyOptions.where = createWhere(
        j.filters,
        fieldMapper,
        table,
        findManyOptions.where,
      );
    }
  });

  findManyOptions.join = _joinObject;
}

export function isFilterExpressionInput(
  filterInput: any,
): filterInput is FilterInput {
  const casted = filterInput as FilterInput;
  return !!casted.expressions;
}

export function traverseFiltersAndApplyFunction(
  where: IWhereCondition,
  callback: { (value: IWhereFilters, key: string): void },
): void {
  const filters: IWhereFilters = where.filters;

  for (const filter in filters) {
    callback(filters, filter);
  }

  if (Array.isArray(where.childExpressions)) {
    where.childExpressions.map((expr) =>
      traverseFiltersAndApplyFunction(expr, callback),
    );
  }
}
