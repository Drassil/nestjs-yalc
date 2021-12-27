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
} from "typeorm";
import { GqlAgGridFieldsMapper } from "@nestjs-yalc/ag-grid/gqlfields.decorator";
import { IFieldMapper } from "@nestjs-yalc/interfaces/maps.interface";
import {
  IAgQueryParams,
  agQueryParamsFactory,
  agQueryParamsNoPaginationFactory,
} from "./ag-grid.args";
import {
  GeneralFilters,
  FilterType,
  SortDirection,
  Operators,
  ExtraArgsStrategy,
  RowDefaultValues,
} from "./ag-grid.enum";
import {
  AgGridFindManyOptions,
  DateFilterModel,
  FilterInput,
  FilterModel,
  ICombinedWhereModel,
  ICombinedSimpleModel,
  ISimpleFilterModel,
  ISetFilterModel,
  IAgGridArgsOptions,
  IAgGridArgsSingleOptions,
} from "./ag-grid.interface";
import {
  findOperatorTypes,
  IFilterArg,
  IWhereCondition,
  IWhereConditionType,
} from "./ag-grid.type";
import {
  applyJoinArguments,
  columnConversion,
  forceFilters,
  isAskingForCount,
  isSymbolic,
  objectToFieldMapper,
} from "./ag-grid.helpers";
import {
  AgGridError,
  AgGridFilterNotSupportedError,
  AgGridFilterProhibited,
  AgGridInvalidArgumentError,
  AgGridInvalidOperatorError,
} from "./ag-grid.error";
import { DateHelper } from "@nestjs-yalc/utils/date.helper";
import { EntityFieldsNames } from "typeorm/common/EntityFieldsNames";
import { agJoinArgFactory } from "./ag-grid.input";
import returnValue from "@nestjs-yalc/utils/returnValue";
import { GraphQLResolveInfo } from "graphql";
import { FilterOption, FilterOptionType } from "./object.decorator";
import {
  ArgumentsError,
  MissingArgumentsError,
} from "@nestjs-yalc/ag-grid/missing-arguments.error";
import {
  isCombinedFilterModel,
  isDateFilterModel,
  isFilterModel,
  isNumberFilterModel,
  isSetFilterModel,
  isTextFilterModel,
} from "./ag-grid-type-checker.utils";

export function getTextFilter(filter: string, firstParameter: string) {
  switch (filter.toLowerCase()) {
    case GeneralFilters.EQUALS.toLowerCase():
      return Equal(firstParameter);
    //NOT_EQUAL should use the EQUALS condition, but the name is a little bit different
    case GeneralFilters.EQUAL.toLowerCase():
      return Equal(firstParameter);
    case GeneralFilters.STARTS_WITH.toLowerCase():
      return Like(`${firstParameter}%`);
    case GeneralFilters.ENDS_WITH.toLowerCase():
      return Like(`%${firstParameter}`);
    case GeneralFilters.CONTAINS.toLowerCase():
    case GeneralFilters.LIKE.toLowerCase():
      return Like(`%${firstParameter}%`);
    default:
      throw new AgGridFilterNotSupportedError(`filter: ${filter} type: TEXT`);
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
    case GeneralFilters.LESS_THAN.toLowerCase():
      return LessThan(firstParameter);
    case GeneralFilters.LESS_THAN_OR_EQUAL.toLowerCase():
      return LessThanOrEqual(firstParameter);
    case GeneralFilters.MORE_THAN.toLowerCase():
      return MoreThan(firstParameter);
    case GeneralFilters.MORE_THAN_OR_EQUAL.toLowerCase():
      return MoreThanOrEqual(firstParameter);
    case GeneralFilters.IN_RANGE.toLowerCase():
      return Between(firstParameter, secondParameter) as FindOperator<number>;
    default:
      throw new AgGridFilterNotSupportedError(`filter: ${filter} type: NUMBER`);
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
    case GeneralFilters.LESS_THAN.toLowerCase():
      return LessThan(firstParameter);
    case GeneralFilters.MORE_THAN.toLowerCase():
      return MoreThan(firstParameter);
    case GeneralFilters.IN_RANGE.toLowerCase():
      return Between(firstParameter, secondParameter) as FindOperator<string>;
    case GeneralFilters.IN_DATE.toLowerCase():
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
      throw new AgGridFilterNotSupportedError(`filter: ${filter} type: DATE`);
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
    throw new AgGridInvalidArgumentError();
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
  if (filterName.toLowerCase() === GeneralFilters.IS_NULL.toLowerCase()) {
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
      throw new AgGridFilterNotSupportedError(
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
      throw new AgGridInvalidOperatorError();
    }
    return {
      operator: filter.operator,
      filter_1: convertFilter(filter.condition1),
      filter_2: convertFilter(filter.condition2),
    };
  }

  if (!isFilterModel(filter)) throw new AgGridInvalidArgumentError();

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
    throw new AgGridFilterNotSupportedError(`${JSON.stringify(filter)}`);
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
        throw new AgGridError(
          `Field can't use more than one expression type on same expression: ${exprTypes}`
        );
      }

      const exprType = exprTypes[0] as FilterType;

      const expr = field[exprType];

      if (!expr)
        throw new Error("Expression not found! It should never happen");

      const dbFieldName = columnConversion(fieldMapper, expr.field);

      const filterName = `${prefix}${dbFieldName}`;

      filtersObjectCleared.push({
        ...expr,
        field: filterName,
        filterType: exprType as any /**@todo fix type */,
      });
    });
  }

  where.operator = filtersObject.operator;

  // we skip the "filters" property of the first level and use the childExpressions
  // directly in order to be able processing conditions on same column name
  const childExpressions: IWhereCondition[] = [];
  for (const expr of filtersObjectCleared) {
    // for every property in the mapper or in the query we're checking if the relative filter exist
    const key = expr.field;

    if (isFilterModel(expr) || isCombinedFilterModel(expr)) {
      // after processing the filter, we take advantage of a function to perform all the necessary checks
      // and manage the filter cases based on the type of the filter itself
      childExpressions.push({
        filters: { [key]: resolveFilter(expr) },
      });
    } else {
      throw new AgGridFilterNotSupportedError(`${JSON.stringify(expr)}`);
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
  data: IFieldMapper | undefined
): string[] {
  for (let i = 0; i < select.length; i++) {
    if (isSymbolic(data, select[i])) {
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
      throw new AgGridFilterProhibited();
    }
  }
  const { childExpressions } = where;
  if (Array.isArray(childExpressions)) {
    childExpressions.forEach((expr) => checkFilterScope(expr, filterOption));
  }
}

export function mapAgGridParams(
  params: IAgGridArgsOptions | undefined,
  ctx: GqlExecutionContext,
  args: IAgQueryParams,
  info: GraphQLResolveInfo
): AgGridFindManyOptions {
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
  const select = GqlAgGridFieldsMapper(fieldMapper, ctx.getInfo());
  // Remove the symbolic parameters
  if (select) {
    removeSymbolicSelection(select, fieldMapper);
  }

  // MAP filter -> where
  let where = args.filters
    ? createWhere(args.filters, fieldMapper)
    : { filters: {} };

  if (filterOption) {
    checkFilterScope(where, filterOption);
  }

  // MAP sorting -> order
  const order: {
    [P in EntityFieldsNames]?: "ASC" | "DESC" | 1 | -1;
  } = {};

  const sorting = args.sorting ?? defaultSorting;
  if (sorting) {
    sorting.forEach((sortParams) => {
      const colName = columnConversion(
        fieldMapper,
        sortParams.colId.toString()
      );
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
      throw new AgGridError(
        `Invalid max number of row selected: cannot exeed max ${maxRow}`
      );
    }
  };

  // args.endRow is always defined due to the default value in agQueryParamsFactory!
  const take = args.endRow && checkMaxRow(args.endRow - skip);

  const skipCount = !isAskingForCount(ctx.getInfo());

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
      forcedFilters.push({
        key: argName, // the column name mapping is executed internally
        value: args[argName],
        descriptors: params.extraArgs[argName],
      });
    }

    where = forceFilters(where, forcedFilters, fieldMapper);
  }

  const findManyOptions: AgGridFindManyOptions = {
    skip,
    take,
    order,
    select,
    where,
    info,
    extra: {
      skipCount,
    },
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

export const AgGridArgsFactory = <T>(
  data: IAgGridArgsOptions | undefined,
  ctx: ExecutionContext
): AgGridFindManyOptions<T> => {
  const gqlCtx = GqlExecutionContext.create(ctx);

  const params = mapAgGridParams(
    data,
    gqlCtx,
    gqlCtx.getArgs(),
    gqlCtx.getInfo()
  );

  return params;
};

export const AgGridArgsMapper = createParamDecorator(AgGridArgsFactory);

/**
 * Combine multiple param decorators
 */
export const AgGridCombineDecorators = (params: IAgGridArgsOptions) => {
  const argDecorators: ParameterDecorator[] = [];
  if (params.extraArgs) {
    for (const argName of Object.keys(params.extraArgs)) {
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
        nullable: true,
      });
    }
  }

  const args = Args(params.gql ?? {});
  const mapper = AgGridArgsMapper(params);
  return function (target: any, key: string, index: number) {
    args(target, key, index);
    joinArg && joinArg(target, key, index);
    argDecorators.map((d) => d(target, key, index));
    mapper(target, key, index);
  };
};

export const AgGridArgs = (params: IAgGridArgsOptions) => {
  const gqlOptions = params.gql ?? {};
  if (!gqlOptions.type) {
    gqlOptions.type = returnValue(
      agQueryParamsFactory(params.defaultValue, params.entityType)
    );
  }

  params.gql = gqlOptions;

  return AgGridCombineDecorators(params);
};

/**
 * Combine multiple param decorators
 */
export const AgGridArgsNoPagination = (params: IAgGridArgsOptions) => {
  const gqlOptions = params.gql ?? {};
  if (!gqlOptions.type) {
    gqlOptions.type = returnValue(
      agQueryParamsNoPaginationFactory(params.defaultValue, params.entityType)
    );
  }

  params.gql = gqlOptions;

  return AgGridCombineDecorators(params);
};

export function AgGridArgsSingleDecoratorMapper<T>(
  params: IAgGridArgsOptions | undefined,
  args: IAgQueryParams,
  info: GraphQLResolveInfo
): AgGridFindManyOptions<T> {
  const findManyOptions: AgGridFindManyOptions = {};

  if (params) {
    const fieldType = params.fieldType ?? params.entityType;
    if (fieldType) {
      findManyOptions.select = GqlAgGridFieldsMapper(fieldType, info);

      const fieldMapper = objectToFieldMapper(fieldType);

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

export const AgGridArgsSingleDecoratorFactory = <T>(
  data: IAgGridArgsOptions | undefined,
  ctx: ExecutionContext
): AgGridFindManyOptions<T> => {
  const gqlCtx = GqlExecutionContext.create(ctx);

  return AgGridArgsSingleDecoratorMapper<T>(
    data,
    gqlCtx.getArgs(),
    gqlCtx.getInfo()
  );
};

export const AgGridArgsSingleDecorator = createParamDecorator(
  AgGridArgsSingleDecoratorFactory
);

export const AgGridArgsSingle = (params: IAgGridArgsSingleOptions) => {
  let joinArg: ParameterDecorator;
  if (params.entityType) {
    const JoinOptionInput = agJoinArgFactory(params.entityType);

    if (JoinOptionInput) {
      joinArg = Args("join", {
        type:
          /*istanbul ignore next */
          () => JoinOptionInput,
        nullable: true,
      });
    }
  }

  const mapper = AgGridArgsSingleDecorator(params);
  return function (target: any, key: string, index: number) {
    joinArg && joinArg(target, key, index);
    mapper(target, key, index);
  };
};
