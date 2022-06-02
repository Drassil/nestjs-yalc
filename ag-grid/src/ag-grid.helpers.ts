import {
  DataLoaderFactory,
  getDataloaderToken,
} from '@nestjs-yalc/data-loader/dataloader.helper';
import { QueryBuilderHelper } from '@nestjs-yalc/database/query-builder.helper';
import {
  IFieldMapper,
  isFieldMapper,
} from '@nestjs-yalc/interfaces/maps.interface';
import { ClassType } from '@nestjs-yalc/types';
import {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  Provider,
  ValueProvider,
} from '@nestjs/common';
import { ReturnTypeFuncValue } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { Equal, getMetadataArgsStorage, SelectQueryBuilder } from 'typeorm';
import { JoinColumnMetadataArgs } from 'typeorm/metadata-args/JoinColumnMetadataArgs';
import { RelationMetadataArgs } from 'typeorm/metadata-args/RelationMetadataArgs';
import { createWhere, getFindOperator } from './ag-grid-args.decorator';
import {
  isCombinedWhereModel,
  isFindOperator,
} from './ag-grid-type-checker.utils';
import { FilterType, Operators } from './ag-grid.enum';
import {
  AgGridConditionNotSupportedError,
  AgGridNotPossibleError,
  AgGridStringWhereError,
} from './ag-grid.error';
import { JoinArgOptions, JoinTypes } from './ag-grid.input';
import {
  IExtraArg,
  AgGridFindManyOptions,
  FilterInput,
} from './ag-grid.interface';
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
import {
  GenericService,
  GenericServiceFactory,
} from './generic-service.service';
import {
  DstExtended,
  getAgGridFieldMetadataList,
  getAgGridObjectMetadata,
  IAgGridFieldMetadata,
  IFieldAndFilterMapper,
  isDstExtended,
} from './object.decorator';
export const columnConversion = (
  key: string,
  data: IFieldMapper | { [key: string]: IAgGridFieldMetadata } | undefined,
): string => {
  if (data) {
    const dst = data[key]?.dst ?? key;
    return getDestinationFieldName(dst);
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
        columnConversion(property.key, fieldMap),
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

export function getDestinationFieldName(dst: string | DstExtended): string {
  if (isDstExtended(dst)) {
    return dst.name;
  }

  return dst;
}

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

  fieldMapper.extraInfo = {};

  const objectMetadata = getAgGridObjectMetadata(object as any);

  if (objectMetadata) {
    fieldMapper.filterOption = objectMetadata;

    const fieldMetadataList = getAgGridFieldMetadataList(object as any);

    if (fieldMetadataList) {
      for (const propertyName of Object.keys(fieldMetadataList)) {
        const fieldMetadata = fieldMetadataList[propertyName];
        const { src, dst, ...fieldMapperProperties } = fieldMetadata;
        if (src) {
          const newDst = dst ? getDestinationFieldName(dst) : src;

          fieldMapper.field[src] = {
            dst: newDst,
            ...fieldMapperProperties,
            _propertyName: propertyName,
          };

          const gqlType = fieldMetadata.gqlType?.();

          if (gqlType) {
            fieldMapper.extraInfo[src] = objectToFieldMapper(gqlType);
          }
        }
      }
    }
  } else if (isFieldMapper(object)) {
    fieldMapper.field = object;
  } else if (isIFieldAndFilterMapper(object as any)) {
    fieldMapper = object as IFieldAndFilterMapper;
  } /**
  @todo rework or delete, it throws an error with enum as gqlType
  
  else if (Object.keys(object).length !== 0) {
    console.trace(object);
    throw new TypeError(
      `This object is not compatible with IFieldMapper ${JSON.stringify(
        object,
      )}`,
    );
  } */

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

export interface IProviderOverride<T = any> {
  provider:
    | ClassProvider<T>
    | ValueProvider<T>
    | FactoryProvider<T>
    | ExistingProvider<T>;
}

export interface IResolverOverride<T = any> {
  provider: ClassType<T>;
}

interface IGenericServiceOptions<Entity> {
  dbConnection: string;
  entityModel?: ClassType<Entity>;
  /**
   * Used only if the service has not external injected dependency rather than the repository
   */
  providerClass?: ClassType<GenericService<Entity>>;
}

interface IDataLoaderOptions<Entity> {
  databaseKey: keyof Entity;
  entityModel?: ClassType<Entity>;
}

export interface IAgGridDependencyFactoryOptions<Entity> {
  entityModel: ClassType<Entity>;
  resolver?:
    | Omit<IGenericResolverOptions<Entity>, 'entityModel'>
    | IResolverOverride
    | false;
  service?: IGenericServiceOptions<Entity> | IProviderOverride;
  dataloader?: IDataLoaderOptions<Entity> | IProviderOverride;
  repository?: ClassType<AgGridRepository<Entity>>;
}

export function isProviderOverride(
  resolver: any,
): resolver is IProviderOverride {
  const casted = resolver as IProviderOverride;
  return !!casted.provider;
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
      serviceToken = getProviderToken(service.provider.provide);
      providers.push(service.provider);
    } else {
      const provider = GenericServiceFactory<Entity>(
        service.entityModel ?? entityModel,
        service.dbConnection,
        service.providerClass,
      );

      serviceToken = getProviderToken(provider.provide);

      providers.push(provider);

      // We always want a string alias for this provider
      if (typeof provider.provide !== 'string') {
        providers.push({
          provide: serviceToken,
          useExisting: provider.provide,
        });
      }
    }
  }

  if (dataloader) {
    if (isProviderOverride(dataloader)) {
      dataLoaderToken = getProviderToken(dataloader.provider.provide);
      providers.push(dataloader.provider);
    } else {
      dataLoaderToken = getDataloaderToken(
        dataloader.entityModel ?? entityModel,
      );
      providers.push(
        DataLoaderFactory<Entity>(
          dataloader.databaseKey,
          dataloader.entityModel ?? entityModel,
          serviceToken,
        ),
      );
    }
  }

  if (resolver !== false) {
    resolverOptions.service = {
      serviceToken,
      dataLoaderToken,
    };

    providers.push(
      resolver && isProviderOverride(resolver)
        ? resolver.provider
        : resolverFactory<Entity>(resolverOptions),
    );
  }

  return {
    providers,
    repository: repository ?? AgGridRepositoryFactory<Entity>(entityModel),
  };
}

export function getProviderToken(
  // eslint-disable-next-line @typescript-eslint/ban-types
  entity: ClassType | Provider | string | symbol | Function,
) {
  if (entity && typeof entity === 'object' && entity.provide) {
    return typeof entity.provide === 'function'
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
    `Filter type not supported for native conversion: ${type}`,
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
      : { _propertyName: r.propertyName },
  }));
}

export function getTypeProperties<Entity>(entityModel: ClassType<Entity>) {
  const columns = getMetadataArgsStorage().columns.filter(
    (v) =>
      typeof v.target !== 'string' &&
      (entityModel.prototype instanceof v.target || entityModel === v.target),
  );

  // to get ag-grid fields
  const fieldMetadataList = getAgGridFieldMetadataList(entityModel);

  if (fieldMetadataList) {
    for (const propertyName of Object.keys(fieldMetadataList)) {
      const fieldMetadata = fieldMetadataList[propertyName];

      if (fieldMetadata.mode !== 'derived') {
        // skip non virtual columns
        continue;
      }

      columns.push({
        propertyName,
        target: entityModel,
        mode: 'regular',
        options: {},
      });
    }
  }

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
  fieldMapper: { [key: string]: IAgGridFieldMetadata },
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

    const type = fieldMapper[table].gqlType?.();
    const _fieldMapper: IFieldAndFilterMapper = type
      ? objectToFieldMapper(type)
      : { field: {} };

    if (j.filters) {
      findManyOptions.where = createWhere(
        j.filters,
        _fieldMapper.field,
        table,
        findManyOptions.where,
      );
    }
  });

  findManyOptions.join = _joinObject;

  findManyOptions.extra = {
    ...findManyOptions.extra,
    _aliasType: _joinObject.alias,
  };
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

// TODO: refactoring formatRawSelection*

export function formatRawSelectionWithoutAlias(
  selection: string,
  /* istanbul ignore next */
  prefix = '',
): string {
  let _prefix = '';
  if (prefix) {
    _prefix = prefix + `.`;
  }

  selection = `${_prefix}${selection}`;

  return selection;
}

export function formatRawSelection(
  selection: string,
  fieldName: string,
  /* istanbul ignore next */
  prefix = '',
  onlyAlias = false,
): string {
  let aliasPrefix = '';
  let _prefix = '';
  if (prefix) {
    aliasPrefix = prefix + '_';
    _prefix = prefix + `.`;
  }

  const alias = `${aliasPrefix}${fieldName}`;

  if (onlyAlias) return alias;

  selection = `${_prefix}${selection} AS \`${alias}\``;

  return selection;
}

/**
 * Derived fields need metadata attached in order to be processed by
 * the AgGrid Repository. Use this method to apply the proper
 * selection with metadata to a find option object
 */
export function applySelectOnFind<T = any>(
  findOptions: AgGridFindManyOptions,
  field: keyof T,
  fieldMapper: { [key: string]: IAgGridFieldMetadata },
  alias = '',
  /**
   * If it's a nested field, you need to specify a path
   */
  path = '',
) {
  if (path && !path.endsWith('.')) path = path + '.';

  const fieldName = field.toString();
  const dst = columnConversion(fieldName, fieldMapper).toString();

  const key = path + dst;

  if (!findOptions.extra) {
    findOptions.extra = { _keysMeta: {} };
  }

  if (fieldMapper[fieldName]?.mode === 'derived' || path) {
    const keysMeta = findOptions.extra._keysMeta ?? {};

    // do not apply twice
    if (keysMeta[key]) return;

    keysMeta[key] = {
      fieldMapper: fieldMapper[fieldName],
      isNested: !!path,
      rawSelect: formatRawSelection(dst, fieldName, alias),
    };

    findOptions.extra._keysMeta = keysMeta;
  } else {
    const selection = findOptions.select ?? [];

    selection.push(key);

    findOptions.select = selection;
  }
}
