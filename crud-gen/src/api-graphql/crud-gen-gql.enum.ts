import { AnyFunction, ClassType } from '@nestjs-yalc/types/globals.d.js';
import { isClass } from '@nestjs-yalc/utils/class.helper.js';
import { registerEnumType } from '@nestjs/graphql';
import {
  GeneralFilters,
  FilterType,
  Operators,
  SortDirection,
  entityFieldsEnumFactory,
} from '../crud-gen.enum.js';

registerEnumType(GeneralFilters, {
  name: 'GeneralFiltersEnum',
});

registerEnumType(FilterType, {
  name: 'FilterTypeEnum',
});

registerEnumType(Operators, {
  name: 'FilterOperatorsEnum',
});

registerEnumType(SortDirection, {
  name: 'SortDirection',
});

const fieldsEnumCache = new WeakMap();
export function entityFieldsEnumGqlFactory<Entity>(
  entityModel: ClassType<Entity> | AnyFunction,
): { [index: string]: string } {
  const prototype = !isClass(entityModel) ? entityModel.prototype : entityModel;
  const res = entityFieldsEnumFactory(entityModel);

  if (!res.cached)
    registerEnumType(res.enum, {
      name: `${res.prototype.name}FieldEnum`,
    });

  fieldsEnumCache.set(prototype, res.enum);

  return res.enum;
}
