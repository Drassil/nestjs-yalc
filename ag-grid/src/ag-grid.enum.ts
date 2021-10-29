import { ClassType } from '@nestjs-yalc/types';
import { registerEnumType } from '@nestjs/graphql';
import { getMappedTypeProperties } from './ag-grid.helpers';

export enum GeneralFilters {
  NOT = 'not',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  EQUALS = 'equals',
  EQUAL = 'equal',
  NOT_EQUAL = 'notEqual',
  LIKE = 'like',
  NOT_LIKE = 'notLike',
  BETWEEN = 'between',
  NOT_BETWEEN = 'notBetween',
  IN = 'in',
  NOT_IN = 'notIn',
  STARTS_WITH = 'startsWith',
  NOT_STARTS_WITH = 'notStartsWith',
  ENDS_WITH = 'endsWith',
  NOT_ENDS_WITH = 'notEndsWith',
  LESS_THAN = 'lessThan',
  NOT_LESS_THAN = 'notLessThan',
  LESS_THAN_OR_EQUAL = 'lessThanOrEqual',
  NOT_LESS_THAN_OR_EQUAL = 'notLessThanOrEqual',
  MORE_THAN = 'greaterThan',
  NOT_MORE_THAN = 'notGreaterThan',
  MORE_THAN_OR_EQUAL = 'greaterThanOrEqual',
  NOT_MORE_THAN_OR_EQUAL = 'notGreaterThanOrEqual',
  // This is only used for dates
  IN_RANGE = 'inRange',
  IN_DATE = 'inDate',
}

registerEnumType(GeneralFilters, {
  name: 'GeneralFiltersEnum',
});

export enum FilterType {
  TEXT = 'text',
  MULTI = 'multi',
  NUMBER = 'number',
  DATE = 'date',
  SET = 'set',
}

registerEnumType(FilterType, {
  name: 'FilterTypeEnum',
});

export enum Operators {
  AND = 'AND',
  OR = 'OR',
}

registerEnumType(Operators, {
  name: 'FilterOperatorsEnum',
});

export enum SortDirection {
  DESC = 'DESC',
  ASC = 'ASC',
}

registerEnumType(SortDirection, {
  name: 'SortDirection',
});

export enum CustomWhereKeys {
  MULTICOLUMNJOINOPTIONS = 'multiColumnJoinOptions',
  MULTICOLUMNJOINOPERATOR = 'multiColumnJoinOperator',
  OPERATOR = 'operator',
}

export enum ExtraArgsStrategy {
  /**
   * No checking strategy applied to the extra arguments
   */
  DEFAULT,
  /**
   * At least one of the extra arguments should be defined
   */
  AT_LEAST_ONE,
  /**
   * Only one of them should be defined.
   * NOTE: it's better to implement this by using native graphql https://stackoverflow.com/a/50042675/1964544
   */
  ONLY_ONE,
}

export enum RowDefaultValues {
  END_ROW = 100,
  START_ROW = 0,
  MAX_ROW = 200,
}

const fieldsEnumCache = new WeakMap();
export function entityFieldsEnumFactory<Entity>(
  entityModel: ClassType<Entity>,
): { [index: string]: string } {
  let cached;
  if ((cached = fieldsEnumCache.get(entityModel))) return cached;

  const properties: { [x in string | number]: any } = {};

  getMappedTypeProperties(entityModel).map((v) => (properties[v] = v));

  type FieldsEnumType = keyof typeof properties;
  const FieldsEnum: { [P in FieldsEnumType]: P } = { ...properties };

  registerEnumType(FieldsEnum, {
    name: `${entityModel.name}FieldEnum`,
  });

  fieldsEnumCache.set(entityModel, FieldsEnum);

  return FieldsEnum;
}
