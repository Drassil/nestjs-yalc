import { AnyFunction, ClassType } from '@nestjs-yalc/types';
import { isClass } from '@nestjs-yalc/utils/class.helper.js';
import { registerEnumType } from '@nestjs/graphql';
import { getMappedTypeProperties } from './crud-gen.helpers.js';

export enum GeneralFilters {
  NOT = 'not',
  CONTAINS = 'contains',
  NOTCONTAINS = 'notContains',
  EQUALS = 'equals',
  EQUAL = 'equal',
  NOTEQUAL = 'notEqual',
  LIKE = 'like',
  NOTLIKE = 'notLike',
  BETWEEN = 'between',
  NOTBETWEEN = 'notBetween',
  IN = 'in',
  NOTIN = 'notIn',
  STARTSWITH = 'startsWith',
  NOTSTARTSWITH = 'notStartsWith',
  ENDSWITH = 'endsWith',
  NOTENDSWITH = 'notEndsWith',
  LESSTHAN = 'lessThan',
  NOTLESSTHAN = 'notLessThan',
  LESSTHANOREQUAL = 'lessThanOrEqual',
  NOTLESSTHANOREQUAL = 'notLessThanOrEqual',
  GREATERTHAN = 'greaterThan',
  NOTGREATERTHAN = 'notGreaterThan',
  GREATERTHANOREQUAL = 'greaterThanOrEqual',
  NOTGREATERTHANOREQUAL = 'notGreaterThanOrEqual',
  // This is only used for dates
  INRANGE = 'inRange',
  INDATE = 'inDate',
  ISNULL = 'isNull',
  NOTISNULL = 'notIsNull',

  //VIRTUAL
  VIRTUAL = 'virtual',
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
  entityModel: ClassType<Entity> | AnyFunction,
): { [index: string]: string } {
  let cached;
  const prototype = !isClass(entityModel) ? entityModel.prototype : entityModel;
  if ((cached = fieldsEnumCache.get(prototype))) return cached;

  const properties: { [x in string | number]: any } = {};

  getMappedTypeProperties(prototype).map((v) => (properties[v] = v));

  type FieldsEnumType = keyof typeof properties;
  const FieldsEnum: { [P in FieldsEnumType]: P } = { ...properties };

  registerEnumType(FieldsEnum, {
    name: `${prototype.name}FieldEnum`,
  });

  fieldsEnumCache.set(prototype, FieldsEnum);

  return FieldsEnum;
}
