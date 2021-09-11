import { ClassType } from '@nestjs-yalc/types';
import {
  Field,
  HideField,
  InputType,
  IntersectionType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  agQueryParamsNoPaginationFactory,
  IAgQueryParams,
} from './ag-grid.args';
import {
  entityFieldsEnumFactory,
  FilterType,
  GeneralFilters,
  Operators,
  SortDirection,
} from './ag-grid.enum';
import { getEntityRelations } from './ag-grid.helpers';
import {
  DateFilterModel,
  FilterInput,
  IFilterExpressionsProperty,
  INumberFilterModel,
  ISetFilterModel,
  ITextFilterModel,
} from './ag-grid.interface';

export interface ISortModel<T = any> {
  colId: keyof T | string;
  sort?: SortDirection;
}

export interface ISortModelString<T = any> extends ISortModel<T> {
  colId: string;
}

export interface ISortModelStrict<T> extends ISortModel<T> {
  colId: keyof T;
}

/**
 * @deprecated
 */
@InputType()
export class SortModel<T = any> implements ISortModel<T> {
  colId!: string;
  @Field(() => SortDirection, { nullable: true, defaultValue: 'ASC' })
  sort!: SortDirection;
}

const sortModelCacheMap = new WeakMap();
export function sortModelFactory<Entity>(entityModel: ClassType<Entity>) {
  const cached = sortModelCacheMap.get(entityModel);
  if (cached) return cached;

  const fieldsEnum = entityFieldsEnumFactory(entityModel);
  @InputType(`${entityModel.name}SortModel`)
  class SortModel implements ISortModelStrict<typeof fieldsEnum> {
    @Field(() => fieldsEnum)
    colId!: keyof typeof fieldsEnum;
    @Field(() => SortDirection, { nullable: true, defaultValue: 'ASC' })
    sort!: SortDirection;
  }

  sortModelCacheMap.set(entityModel, SortModel);

  return SortModel;
}

@InputType()
export class RowGroup {
  colId!: string;
  aggFunc!: string;
}

const filterExpressionInputCache = new WeakMap();
export function filterExpressionInputFactory<Entity>(
  entityModel: ClassType<Entity>,
) {
  let cached;
  if ((cached = filterExpressionInputCache.get(entityModel))) return cached;

  const FieldEnum = entityFieldsEnumFactory(entityModel);

  @InputType(`${entityModel.name}FilterTextInput`)
  class FilterText implements ITextFilterModel {
    @HideField()
    filterType: FilterType.TEXT;
    type: GeneralFilters;
    @Field(() => FieldEnum)
    field: string;
    filter: string;
  }

  @InputType(`${entityModel.name}FilterNumberInput`)
  class FilterNumber implements INumberFilterModel {
    @HideField()
    filterType: FilterType.NUMBER;
    type: GeneralFilters;
    @Field(() => FieldEnum)
    field: string;
    filter: number;
  }

  @InputType(`${entityModel.name}FilterDateInput`)
  class FilterDate implements DateFilterModel {
    @HideField()
    filterType: FilterType.DATE;
    type: GeneralFilters;
    @Field(() => FieldEnum)
    field: string;
    filter: number;
  }

  @InputType(`${entityModel.name}FilterSetInput`)
  class FilterSet implements ISetFilterModel {
    @HideField()
    filterType: FilterType.SET;
    values: string[];
    @Field(() => FieldEnum)
    field: string;
  }

  /**
   * Since union for input types are not possible yet, we need this type
   * @see https://github.com/graphql/graphql-spec/issues/488
   */
  @InputType(`${entityModel.name}FilterInput`)
  class FilterExpressionProperty implements IFilterExpressionsProperty {
    @Field(() => FilterText, { nullable: true })
    [FilterType.TEXT]: FilterText;
    @Field(() => FilterNumber, { nullable: true })
    [FilterType.NUMBER]: FilterNumber;
    @Field(() => FilterDate, { nullable: true })
    [FilterType.DATE]: FilterDate;
    @Field(() => FilterSet, { nullable: true })
    [FilterType.SET]: FilterSet;
  }

  @InputType(`${entityModel.name}FilterExpressionInput`)
  class FilterExpression implements FilterInput {
    @Field(() => Operators, { defaultValue: Operators.AND, nullable: true })
    operator?: Operators;
    @Field(() => [FilterExpressionProperty])
    expressions?: FilterExpressionProperty[];
    @Field(() => [FilterExpression])
    childExpressions?: FilterInput[];
  }

  filterExpressionInputCache.set(entityModel, FilterExpression);

  return FilterExpression;
}

export enum JoinTypes {
  LEFT_JOIN,
  INNER_JOIN,
}

export interface JoinArgOptions extends IAgQueryParams {
  joinType?: JoinTypes;
}

// memoize pre-generated InputType
const JoinOptionInputCache = new WeakMap();
export function agJoinArgFactory<Entity>(
  entityModel: ClassType<Entity>,
  defaultValues?: IAgQueryParams,
) {
  // return memoized result if any
  const cached = JoinOptionInputCache.get(entityModel);
  if (cached) return cached;

  const resolverInfoList = getEntityRelations(entityModel);

  if (!resolverInfoList.length) return null;

  @InputType(`${entityModel.name}JoinInputTypePartial`)
  class JoinInput {
    @Field(() => JoinTypes)
    joinType?: JoinTypes;
  }

  registerEnumType(JoinTypes, {
    name: `${entityModel.name}JoinTypes`,
  });

  @InputType(`${entityModel.name}JoinOptionsInputType`)
  class JoinOptionInput {
    [index: string]: ClassType;
  }

  resolverInfoList.forEach((r) => {
    const type = r.relation.type;
    if (typeof type !== 'string') {
      const typeClass = type();
      @InputType(`${entityModel.name}${r.relation.propertyName}JoinInputType`)
      class JoinFullInput extends IntersectionType(
        JoinInput,
        agQueryParamsNoPaginationFactory(defaultValues, typeClass),
      ) {}

      JoinOptionInput.prototype[r.relation.propertyName] = JoinFullInput;
      Field(() => JoinFullInput, { nullable: true })(
        JoinOptionInput.prototype,
        r.relation.propertyName,
      );
    }
  });

  JoinOptionInputCache.set(entityModel, JoinOptionInput);

  return JoinOptionInput;
}
