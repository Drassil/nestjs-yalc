import { IsInt, IsString, Min } from 'class-validator';
import { ClassType } from 'nestjs-yalc/globals.d.js';
import {
  entityFieldsEnumFactory,
  RowDefaultValues,
  SortDirection,
} from '../crud-gen.enum.js';
import {
  ICrudGenBaseParams,
  ICrudGenSimpleParams,
  ISortModel,
  ISortModelStrict,
} from '../api-graphql/crud-gen-gql.interface.js';
import { IPageDataCrudGen } from '../crud-gen.interface.js';

export class CGQueryDto<T = any> implements ICrudGenBaseParams<T> {
  @IsInt()
  @Min(1)
  startRow?: number;

  @IsInt()
  @Min(1)
  endRow?: number;
}

/**
 * @deprecated use sortModelRestFactory instead
 */
export class SortModelRest<T = any> implements ISortModel<T> {
  @IsString()
  colId!: string;

  sort!: SortDirection;
}

const sortModelCacheMap = new WeakMap();
export function sortModelRestFactory<Entity>(entityModel: ClassType<Entity>) {
  const cached = sortModelCacheMap.get(entityModel);
  if (cached) return cached;

  const fieldsEnum = entityFieldsEnumFactory(entityModel);
  class SortModel implements ISortModelStrict<typeof fieldsEnum> {
    colId!: keyof typeof fieldsEnum;

    sort: SortDirection = SortDirection.ASC;
  }

  sortModelCacheMap.set(entityModel, SortModel);

  return SortModel;
}

export const typeMap = new WeakMap();
export function crudGenRestParamsFactory(
  defaultValues?: ICrudGenBaseParams,
  entityModel?: ClassType,
): { new (): ICrudGenBaseParams } {
  const SortType = entityModel
    ? [sortModelRestFactory(entityModel)]
    : [SortModelRest];

  /** @todo implement filters */

  // const FilterType = entityModel
  //   ? filterExpressionInputFactory(entityModel)
  //   : FilterScalar;

  class CrudGenParams implements ICrudGenBaseParams {
    startRow: number = defaultValues?.startRow ?? RowDefaultValues.START_ROW;
    endRow: number = defaultValues?.endRow ?? RowDefaultValues.END_ROW;
    sorting?: typeof SortType;
    // filters?: typeof FilterType;
  }

  typeMap.set(CrudGenParams, CrudGenParams);
  return typeMap.get(CrudGenParams);
}

export function crudGenRestParamsNoPaginationFactory(
  defaultValues?: ICrudGenBaseParams,
  entityModel?: ClassType,
): { new (): ICrudGenBaseParams } {
  const SortType = entityModel
    ? [sortModelRestFactory(entityModel)]
    : [SortModelRest];

  /** @todo implement filters */

  // const FilterType = entityModel
  //   ? filterExpressionInputFactory(entityModel)
  //   : FilterScalar;

  class CrudGenParams implements ICrudGenBaseParams {
    sorting?: typeof SortType = defaultValues?.sorting;
    // filters?: typeof FilterType = defaultValues?.filters;
  }

  typeMap.set(CrudGenParams, CrudGenParams);
  return typeMap.get(CrudGenParams);
}

export class PageData implements IPageDataCrudGen {
  public count!: number;

  public startRow!: number;

  public endRow!: number;
}

export class CGRestQueryArgs<T = any> implements ICrudGenSimpleParams<T> {
  startRow?: number = RowDefaultValues.START_ROW;
  endRow?: number = RowDefaultValues.END_ROW;
  /**
   * @todo implements other properties (where, select, sort, etc.)
   */
}
