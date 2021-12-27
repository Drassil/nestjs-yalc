/* istanbul ignore file */

import { IFieldMapper } from "@nestjs-yalc/interfaces/maps.interface";
import { ClassType } from "@nestjs-yalc/types";
import { ArgsOptions, ReturnTypeFuncValue } from "@nestjs/graphql";
import { GraphQLResolveInfo } from "graphql";
import { FindManyOptions, FindOperator } from "typeorm";
import { IAgQueryParams } from "./ag-grid.args";
import {
  ExtraArgsStrategy,
  FilterType,
  GeneralFilters,
  Operators,
} from "./ag-grid.enum";
import { IWhereCondition } from "./ag-grid.type";
import { IFieldAndFilterMapper } from "./object.decorator";

export interface IBaseFilterModel {
  filterType: FilterType;
  field: string;
}

export interface ISimpleFilterModel extends IBaseFilterModel {
  type: GeneralFilters;

  filter?: string | number;
}

export interface ITextFilterModel extends ISimpleFilterModel {
  // always 'text' for text filter
  filterType: FilterType.TEXT;

  // one of the filter options, e.g. 'equals'
  type: GeneralFilters;

  // the text value associated with the filter.
  // it's optional as custom filters may not
  // have a text value
  filter?: string;
}

export interface ISetFilterModel extends IBaseFilterModel {
  filterType: FilterType.SET;

  values: (string | number)[];
}

export interface INumberFilterModel extends ISimpleFilterModel {
  // always 'number' for number filter
  filterType: FilterType.NUMBER;

  // one of the filter options, e.g. 'equals'
  type: GeneralFilters;

  // the number value(s) associated with the filter.
  // custom filters can have no values (hence both are optional).
  // range filter has two values (from and to).
  filter?: number;
  filterTo?: number;
}

export interface DateFilterModel extends ISimpleFilterModel {
  // always 'date' for date filter
  filterType: FilterType.DATE;

  // one of the filter options, e.g. 'equals'
  type: GeneralFilters;

  // the date value(s) associated with the filter.
  // the type is string and format is always YYYY-MM-DD e.g. 2019-05-24
  // custom filters can have no values (hence both are optional).
  // range filter has two values (from and to).
  dateFrom?: string;
  dateTo?: string;
}

export type GenericFilterModel =
  | ISimpleFilterModel
  | ITextFilterModel
  | INumberFilterModel;

export type FilterModel =
  | GenericFilterModel
  | DateFilterModel
  | ISetFilterModel;

export interface ICombinedSimpleModel {
  // the filter type: date, number or text
  filterType: FilterType;

  operator: Operators;

  // two instances of the filter model
  condition1: FilterModel;
  condition2: FilterModel;
}

export type FilterInputStrict = (FilterModel | ICombinedSimpleModel)[];

export interface IMultiColumnProperty {
  multiColumnJoinOptions?: IMultiColumnJoinOptions;
}

export interface IMultiColumnObject extends IMultiColumnProperty {
  multiColumnJoinOperator: Operators;
}

/**
 * @deprecated
 */
export type IFilterInputOld = {
  [key: string]:
    | FilterModel
    | ICombinedSimpleModel
    | IMultiColumnJoinOptions
    | undefined;
} & IMultiColumnProperty;

export interface IFilterExpressionsProperty {
  [FilterType.TEXT]?: ITextFilterModel;
  [FilterType.NUMBER]?: INumberFilterModel;
  [FilterType.DATE]?: DateFilterModel;
  [FilterType.SET]?: ISetFilterModel;
  [FilterType.MULTI]?: never;
}

export interface FilterInput {
  operator?: Operators;
  expressions?: IFilterExpressionsProperty[];
  childExpressions?: FilterInput[];
}

export interface IAgGridFindExtraOptions {
  /** It apply limit and offset at the same level of the join instead of
   * wrapping the join with another query by applying the limit later
   */
  rawLimit?: boolean;
  /*
   * skip count in getter functions that include the counter
   * value. It will return -1 instead. Useful to avoid not needed
   * count operation, for instance: when the user is not asking the field
   */
  skipCount?: boolean;
}

export interface AgGridFindManyOptions<T = any> extends FindManyOptions<T> {
  where?: IWhereCondition;
  /** Contains useful information about the graphql request */
  info?: GraphQLResolveInfo;
  extra?: IAgGridFindExtraOptions;
  subQueryFilters?: AgGridFindManyOptions<T>;
}

export type IMultiColumnJoinOptions = {
  [key: string]:
    | FilterModel
    | ICombinedSimpleModel
    | IMultiColumnJoinOptions
    | Operators
    | undefined;
} & IMultiColumnObject;

export interface ICombinedWhereModel {
  operator: Operators;
  // two instances of the filter model
  filter_1: FindOperator<string | number | Date | null> | ICombinedWhereModel;
  filter_2: FindOperator<string | number | Date | null> | ICombinedWhereModel;
}

export interface IExtraArg {
  options?: ArgsOptions;
  filterType: FilterType;
  filterCondition: GeneralFilters;
}

export interface IAgGridArgsSingleOptions {
  /**
   * @property Options for the nestjs Args decorator
   */
  gql?: ArgsOptions;
  /**
   * @deprecated use fieldType instead
   * @property fieldMap is used internally to convert names of exposed fields to database fields
   */
  fieldMap?: IFieldMapper | IFieldAndFilterMapper;
  /**
   * @property fieldType is used internally to retrieve information about the returned type
   */
  fieldType?: ClassType | ReturnTypeFuncValue;
  /**
   * @property entityType is used internally to generate graphql types for the inputs
   */
  entityType?: ClassType;
}

export interface IAgGridArgsOptions extends IAgGridArgsSingleOptions {
  defaultValue?: IAgQueryParams;
  /**
   * Filters with direct arguments
   */
  extraArgsStrategy?: ExtraArgsStrategy;
  extraArgs?: {
    [index: string]: IExtraArg;
  };
  options?: {
    maxRow: number;
  };
}
