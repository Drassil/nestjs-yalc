import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Args, GqlExecutionContext } from "@nestjs/graphql";
import {
  Not,
  Equal,
  FindOperator,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Like,
  Between,
  In,
  IsNull,
  ObjectLiteral
} from "typeorm";
import { GqlCrudGenFieldsMapper } from "@nestjs-yalc/crud-gen/gqlfields.decorator.js";
import { IFieldMapper } from "@nestjs-yalc/interfaces/maps.interface.js";
import {
  IAgQueryParams,
  agQueryParamsFactory,
  agQueryParamsNoPaginationFactory
} from "./crud-gen.args.js";
import {
  GeneralFilters,
  FilterType,
  SortDirection,
  Operators,
  ExtraArgsStrategy,
  RowDefaultValues
} from "./crud-gen.enum.js";
import {
  CrudGenFindManyOptions,
  DateFilterModel,
  FilterInput,
  FilterModel,
  ICombinedWhereModel,
  ICombinedSimpleModel,
  ISimpleFilterModel,
  ISetFilterModel,
  ICrudGenArgsOptions,
  ICrudGenArgsSingleOptions
} from "./crud-gen.interface.js";
import {
  findOperatorTypes,
  IFilterArg,
  IWhereCondition,
  IWhereConditionType
} from "./crud-gen.type.js";
import {
  applyJoinArguments,
  columnConversion,
  forceFilters,
  formatRawSelectionWithoutAlias,
  getDestinationFieldName,
  isAskingForCount,
  isSymbolic,
  objectToFieldMapper
} from "./crud-gen.helpers.js";
import {
  CrudGenError,
  CrudGenFilterNotSupportedError,
  CrudGenFilterProhibited,
  CrudGenInvalidArgumentError,
  CrudGenInvalidOperatorError
} from "./crud-gen.error.js";
import { DateHelper } from "@nestjs-yalc/utils/date.helper.js";
import { agJoinArgFactory } from "./crud-gen.input.js";
import returnValue from "@nestjs-yalc/utils/returnValue.js";
import { GraphQLResolveInfo } from "graphql";
import { FilterOption, FilterOptionType } from "./object.decorator.js";
import {
  ArgumentsError,
  MissingArgumentsError
} from "@nestjs-yalc/crud-gen/missing-arguments.error.js";
import {
  isCombinedFilterModel,
  isDateFilterModel,
  isFilterModel,
  isNumberFilterModel,
  isSetFilterModel,
  isTextFilterModel
} from "./crud-gen-type-checker.utils.js";

export function getTextFilter(filter: string, firstParameter: string) {
  switch (filter.toLowerCase()) {
    case GeneralFilters.EQUALS.toLowerCase():
      return Equal(firstParameter);
    //NOT_EQUAL should use the EQUALS condition, but the name is a little bit different
    case GeneralFilters.EQUAL.toLowerCase():
      return Equal(firstParameter);
    case GeneralFilters.STARTSWITH.toLowerCase():
      return Like(`${firstParameter}%`);
    case GeneralFilters.ENDSWITH.toLowerCase():
      return Like(`%${firstParameter}`);
    case GeneralFilters.CONTAINS.toLowerCase():
    case GeneralFilters.LIKE.toLowerCase():
      return Like(`%${firstParameter}%`);
    default:
      throw new CrudGenFilterNotSupportedError(`filter: ${filter} type: TEXT`);
  }
}

export function getNumberFilter(
  filter: string,
  firstParameter: number,
  secondParameter?: number
): FindOperator<number> {
  switch (filter.toLowerCase()) {
    case GeneralFilters.EQUALS.toLowerCase():
      return Equal(firstParameter);
    case GeneralFilters.EQUAL.toLowerCase():
      return Equal(firstParameter);
    case GeneralFilters.LESSTHAN.toLowerCase():
      return LessThan(firstParameter);
    case GeneralFilters.LESSTHANOREQUAL.toLowerCase():
      return LessThanOrEqual(firstParameter);
    case GeneralFilters.GREATERTHAN.toLowerCase():
      return MoreThan(firstParameter);
    case GeneralFilters.GREATERTHANOREQUAL.toLowerCase():
      return MoreThanOrEqual(firstParameter);
    case GeneralFilters.INRANGE.toLowerCase():
      return Between(firstParameter, secondParameter) as FindOperator<number>;
    default:
      throw new CrudGenFilterNotSupportedError(
        `filter: ${filter} type: NUMBER`
      );
  }
}

export function getDateFilter(
  filter: string,
  firstParameter: string,
  secondParameter?: string
) {
  switch (filter.toLowerCase()) {
    case GeneralFilters.EQUALS.toLowerCase():
      return Equal(firstParameter);
    case GeneralFilters.EQUAL.toLowerCase():
      return Equal(firstParameter);
    case GeneralFilters.LESSTHAN.toLowerCase():
      return LessThan(firstParameter);
    case GeneralFilters.GREATERTHAN.toLowerCase():
      return MoreThan(firstParameter);
    case GeneralFilters.INRANGE.toLowerCase():
      return Between(firstParameter, secondParameter) as FindOperator<string>;
    case GeneralFilters.INDATE.toLowerCase():
      const dateFrom = new Date(firstParameter).setHours(0, 0, 0, 0);
      const dateTo = new Date(secondParameter ?? firstParameter).setHours(
        23,
        59,
        59,
        999
      );
      return Between(
        DateHelper.dateToSQLDateTime(new Date(dateFrom)),
        DateHelper.dateToSQLDateTime(new Date(dateTo))
      );
    default:
      throw new CrudGenFilterNotSupportedError(`filter: ${filter} type: DATE`);
  }
}

export function filterSwitch(
  filter: FilterModel,
  filterName?: string
): FindOperator<number | string | Date | null> {
  let arg1: findOperatorTypes = undefined;
  let arg2: findOperatorTypes = undefined;

  // handle SET before hand
  if (isSetFilterModel(filter)) {
    return In(filter.values);
  }

  if (isDateFilterModel(filter)) {
    arg1 = filter.dateFrom;
    arg2 = filter.dateTo;
  } else if (isNumberFilterModel(filter)) {
    arg1 = filter.filter;
    arg2 = filter.filterTo;
  } else {
    arg1 = filter.filter; // text filter model
  }

  if (arg1 === undefined) {
    throw new CrudGenInvalidArgumentError();
  }

  filterName = filterName ?? filter.type;

  return getFindOperator(filter.filterType, filterName, arg1, arg2);
}

export function getFindOperator(
  filterType: FilterType,
  filterName: string,
  arg1: any,
  arg2?: any
): FindOperator<number | string | Date | null> {
  if (filterName.toLowerCase() === GeneralFilters.ISNULL.toLowerCase()) {
    return IsNull();
  }
  switch (filterType) {
    case FilterType.TEXT:
      return getTextFilter(filterName, <string>arg1);
    case FilterType.NUMBER:
      return getNumberFilter(filterName, <number>arg1, <number>arg2);
    case FilterType.DATE:
      return getDateFilter(filterName, <string>arg1, <string>arg2);
    case FilterType.SET:
      return In(arg1);
    default:
      throw new CrudGenFilterNotSupportedError(
        `filter: ${filterName} type: ${filterType}`
      );
  }
}

export function convertFilter(
  filter: FilterModel | ICombinedSimpleModel
): FindOperator<string | number | Date | null> | ICombinedWhereModel {
  if (isCombinedFilterModel(filter)) {
    if (
      filter.operator.toUpperCase() !== Operators.OR &&
      filter.operator.toUpperCase() !== Operators.AND
    ) {
      throw new CrudGenInvalidOperatorError();
    }
    return {
      operator: filter.operator,
      filter_1: convertFilter(filter.condition1),
      filter_2: convertFilter(filter.condition2)
    };
  }

  if (!isFilterModel(filter)) throw new CrudGenInvalidArgumentError();

  let filterToApply;
  if (
    !isSetFilterModel(filter) &&
    filter.type.startsWith("not") &&
    filter.type !== GeneralFilters.NOT
  ) {
    filterToApply = Not(filterSwitch(filter, filter.type.substring(3)));
  } else {
    filterToApply = filterSwitch(filter);
  }
  return filterToApply;
}

export function resolveFilter(
  filter:
    | ICombinedSimpleModel
    | ISimpleFilterModel
    | DateFilterModel
    | ISetFilterModel
): IWhereConditionType {
  let filterToApply: FindOperator<findOperatorTypes> | ICombinedWhereModel;
  if (
    isTextFilterModel(filter) ||
    isNumberFilterModel(filter) ||
    isDateFilterModel(filter) ||
    isSetFilterModel(filter)
  ) {
    filterToApply = convertFilter(filter);
  } else {
    throw new CrudGenFilterNotSupportedError(`${JSON.stringify(filter)}`);
  }
  return filterToApply;
}

export function createWhere(
  filtersObject: FilterInput,
  fieldMapper: IFieldMapper | undefined,
  alias?: string,
  where: IWhereCondition = { filters: {} }
): IWhereCondition {
  if (!filtersObject) {
    return where;
  }

  const prefix = alias ? `${alias}.` : "";

  const filtersObjectCleared: FilterModel[] = [];

  if (filtersObject.expressions) {
    Object.values(filtersObject.expressions).map((field) => {
      const exprTypes = Object.keys(field);

      /**
       * Since union for input types are not possible yet, we need this check
       * @see https://github.com/graphql/graphql-spec/issues/488
       */
      if (exprTypes.length > 1) {
        throw new CrudGenError(
          `Field can't use more than one expression type on same expression: ${exprTypes}`
        );
      }

      const exprType = exprTypes[0] as FilterType;

      const expr = field[exprType];

      if (!expr || !expr.field)
        throw new Error("Expression not found! It should never happen");

      const dbFieldName = columnConversion(expr.field, fieldMapper);

      const filterName = `${prefix}${dbFieldName}`;

      filtersObjectCleared.push({
        ...expr,
        field: filterName,
        filterType: exprType as any /**@todo fix type */
      });
    });
  }

  where.operator = filtersObject.operator;

  // we skip the "filters" property of the first level and use the childExpressions
  // directly in order to be able processing conditions on same column name
  const childExpressions: IWhereCondition[] = where.childExpressions ?? [];
  for (const expr of filtersObjectCleared) {
    // for every property in the mapper or in the query we're checking if the relative filter exist
    const key = expr.field;

    if (isFilterModel(expr) || isCombinedFilterModel(expr)) {
      // after processing the filter, we take advantage of a function to perform all the necessary checks
      // and manage the filter cases based on the type of the filter itself
      childExpressions.push({
        filters: { [key]: resolveFilter(expr) }
      });
    } else {
      throw new CrudGenFilterNotSupportedError(`${JSON.stringify(expr)}`);
    }
  }

  if (filtersObject.childExpressions) {
    filtersObject.childExpressions.forEach((expr) =>
      childExpressions.push(createWhere(expr, fieldMapper))
    );
  }

  where.childExpressions = childExpressions;

  return where;
}

export function removeSymbolicSelection(
  select: string[],
  data: IFieldMapper | undefined,
  path: string
): string[] {
  for (let i = 0; i < select.length; i++) {
    if (isSymbolic(data, path + select[i])) {
      select.splice(i, 1);
      i--;
    }
  }
  return select;
}

export function checkFilterScope(
  where: IWhereCondition,
  filterOption: FilterOption
) {
  for (const key of Object.keys(where.filters)) {
    if (
      !key.includes(".") &&
      filterOption.fields &&
      (filterOption.type === FilterOptionType.INCLUDE
        ? !filterOption.fields.includes(key)
        : filterOption.fields.includes(key))
    ) {
      throw new CrudGenFilterProhibited();
    }
  }
  const { childExpressions } = where;
  if (Array.isArray(childExpressions)) {
    childExpressions.forEach((expr) => checkFilterScope(expr, filterOption));
  }
}

export function mapCrudGenParams<Entity extends ObjectLiteral>(
  params: ICrudGenArgsOptions | undefined,
  ctx: GqlExecutionContext,
  args: IAgQueryParams,
  info: GraphQLResolveInfo
): CrudGenFindManyOptions {
  let filterOption: FilterOption | undefined;
  let fieldMapper: IFieldMapper = {};
  const fieldType = params?.fieldType ?? params?.fieldMap ?? params?.entityType;

  if (fieldType) {
    const fieldMapperAndFilter = objectToFieldMapper(fieldType);

    filterOption = fieldMapperAndFilter.filterOption;
    fieldMapper = fieldMapperAndFilter.field;
  }

  const defaultSorting = params?.defaultValue?.sorting;
  // MAP query fields -> select
  const { keys, keysMeta } = GqlCrudGenFieldsMapper(
    fieldType ?? {},
    ctx.getInfo()
  );

  // MAP filter -> where
  let where = args.filters
    ? createWhere(args.filters, fieldMapper)
    : { filters: {} };

  if (filterOption) {
    checkFilterScope(where, filterOption);
  }

  // MAP sorting -> order
  const order: {
    [P in keyof Entity]?: "ASC" | "DESC" | 1 | -1;
  } = {};

  const sorting = args.sorting ?? defaultSorting;
  if (sorting) {
    sorting.forEach((sortParams) => {
      const col = sortParams.colId.toString();
      let colName: keyof Entity;
      if (fieldMapper[col]?.mode === "derived") {
        colName = formatRawSelectionWithoutAlias(
          getDestinationFieldName(fieldMapper[col].dst)
          // fieldMapper[col]._propertyName ?? fieldMapper[col].dst,
        );
      } else {
        colName = columnConversion(col, fieldMapper);
      }

      const val = sortParams.sort?.toUpperCase();
      const sortDir: "ASC" | "DESC" = <SortDirection>val ?? "ASC";
      order[colName] = sortDir;
    });
  }

  // MAP startRow/endRow -> take/skip
  const maxRow = params?.options?.maxRow ?? RowDefaultValues.MAX_ROW;
  const skip = args.startRow ?? RowDefaultValues.START_ROW;

  const checkMaxRow = (requestRow: number) => {
    if (maxRow === 0 || requestRow < maxRow) {
      return requestRow;
    } else {
      throw new CrudGenError(
        `Invalid max number of row selected: cannot exeed max ${maxRow}`
      );
    }
  };

  // args.endRow is always defined due to the default value in agQueryParamsFactory!
  const take = args.endRow && checkMaxRow(args.endRow - skip);

  const skipCount = !isAskingForCount(ctx.getInfo());

  const extraParameter: { [key: string]: any } = {};
  if (params?.extraArgs) {
    const extraArgsKeys = Object.keys(params.extraArgs);
    switch (params.extraArgsStrategy) {
      case ExtraArgsStrategy.AT_LEAST_ONE:
        if (
          args.length <= 0 ||
          extraArgsKeys.every((argName) => typeof args[argName] === "undefined")
        )
          throw new MissingArgumentsError();
        break;
      case ExtraArgsStrategy.ONLY_ONE:
        if (
          extraArgsKeys.filter(
            (argName) => typeof args[argName] !== "undefined"
          ).length > 1
        )
          throw new ArgumentsError("You must define only one extra arguments");
        break;
      case ExtraArgsStrategy.DEFAULT:
      default:
      // nothing to do
    }

    const forcedFilters: IFilterArg[] = [];
    for (const argName of Object.keys(params.extraArgs)) {
      if (
        params.extraArgs[argName].filterCondition === GeneralFilters.VIRTUAL
      ) {
        extraParameter[argName] = args[argName];
        continue;
      }

      let value = args[argName];
      const filterMiddleware = params.extraArgs[argName].filterMiddleware;

      if (filterMiddleware) {
        value = filterMiddleware(ctx, value);
      }

      forcedFilters.push({
        key: argName, // the column name mapping is executed internally
        value,
        descriptors: params.extraArgs[argName]
      });
    }

    where = forceFilters(where, forcedFilters, fieldMapper);
  }

  const findManyOptions: CrudGenFindManyOptions = {
    skip,
    take,
    order,
    select: keys,
    where,
    info,
    extra: {
      skipCount,
      args: extraParameter,
      _fieldMapper: fieldMapper,
      _keysMeta: keysMeta
    }
  };
  if (params?.entityType && args.join) {
    applyJoinArguments(
      findManyOptions,
      params.entityType.name,
      args.join,
      fieldMapper
    );
  }

  return findManyOptions;
}

export const CrudGenArgsFactory = <T>(
  data: ICrudGenArgsOptions | undefined,
  ctx: ExecutionContext
): CrudGenFindManyOptions<T> => {
  const gqlCtx = GqlExecutionContext.create(ctx);

  const params = mapCrudGenParams(
    data,
    gqlCtx,
    gqlCtx.getArgs(),
    gqlCtx.getInfo()
  );

  return params;
};

export const CrudGenArgsMapper = createParamDecorator(CrudGenArgsFactory);

/**
 * Combine multiple param decorators
 */
export const CrudGenCombineDecorators = (params: ICrudGenArgsOptions) => {
  const argDecorators: ParameterDecorator[] = [];
  if (params.extraArgs) {
    for (const argName of Object.keys(params.extraArgs)) {
      if (params.extraArgs[argName].hidden) continue;

      argDecorators.push(
        Args(argName, params.extraArgs[argName].options ?? {})
      );
    }
  }

  let joinArg: ParameterDecorator;
  if (params.entityType) {
    const JoinOptionInput = agJoinArgFactory(
      params.entityType,
      params.defaultValue
    );

    if (JoinOptionInput) {
      joinArg = Args("join", {
        type:
          /*istanbul ignore next */
          () => JoinOptionInput,
        nullable: true
      });
    }
  }

  const args = Args(params.gql ?? {});
  const mapper = CrudGenArgsMapper(params);
  return function (target: any, key: string, index: number) {
    args(target, key, index);
    joinArg && joinArg(target, key, index);
    argDecorators.map((d) => d(target, key, index));
    mapper(target, key, index);
  };
};

export const CrudGenArgs = (params: ICrudGenArgsOptions) => {
  const gqlOptions = params.gql ?? {};
  if (!gqlOptions.type) {
    gqlOptions.type = returnValue(
      agQueryParamsFactory(params.defaultValue, params.entityType)
    );
  }

  params.gql = gqlOptions;

  return CrudGenCombineDecorators(params);
};

/**
 * Combine multiple param decorators
 */
export const CrudGenArgsNoPagination = (params: ICrudGenArgsOptions) => {
  const gqlOptions = params.gql ?? {};
  if (!gqlOptions.type) {
    gqlOptions.type = returnValue(
      agQueryParamsNoPaginationFactory(params.defaultValue, params.entityType)
    );
  }

  params.gql = gqlOptions;

  return CrudGenCombineDecorators(params);
};

export function CrudGenArgsSingleDecoratorMapper<T>(
  params: ICrudGenArgsOptions | undefined,
  args: IAgQueryParams,
  info: GraphQLResolveInfo
): CrudGenFindManyOptions<T> {
  const findManyOptions: CrudGenFindManyOptions = {};

  if (params) {
    const fieldType = params.fieldType ?? params.entityType;
    if (fieldType) {
      const fieldMapper = objectToFieldMapper(fieldType);

      const { keys, keysMeta } = GqlCrudGenFieldsMapper(fieldType, info);
      findManyOptions.select = keys;
      findManyOptions.extra = {
        _keysMeta: keysMeta,
        _fieldMapper: fieldMapper.field
      };

      if (params.entityType && args.join) {
        applyJoinArguments(
          findManyOptions,
          params.entityType.name,
          args.join,
          fieldMapper.field
        );
      }
    }
  }

  return findManyOptions;
}

export const CrudGenArgsSingleDecoratorFactory = <T>(
  data: ICrudGenArgsOptions | undefined,
  ctx: ExecutionContext
): CrudGenFindManyOptions<T> => {
  const gqlCtx = GqlExecutionContext.create(ctx);

  return CrudGenArgsSingleDecoratorMapper<T>(
    data,
    gqlCtx.getArgs(),
    gqlCtx.getInfo()
  );
};

export const CrudGenArgsSingleDecorator = createParamDecorator(
  CrudGenArgsSingleDecoratorFactory
);

export const CrudGenArgsSingle = (params: ICrudGenArgsSingleOptions) => {
  let joinArg: ParameterDecorator;
  if (params.entityType) {
    const JoinOptionInput = agJoinArgFactory(params.entityType);

    if (JoinOptionInput) {
      joinArg = Args("join", {
        type:
          /*istanbul ignore next */
          () => JoinOptionInput,
        nullable: true
      });
    }
  }

  const mapper = CrudGenArgsSingleDecorator(params);
  return function (target: any, key: string, index: number) {
    joinArg && joinArg(target, key, index);
    mapper(target, key, index);
  };
};
