import { ClassType } from '@nestjs-yalc/types/globals.d.js';
import { AnyFunction } from '@nestjs-yalc/types/globals.d.js';
import {
  Field,
  HideField,
  InputType,
  IntersectionType,
  registerEnumType,
} from '@nestjs/graphql';
import { entityFieldsEnumGqlFactory } from './crud-gen-gql.enum.js';
import { crudGenParamsNoPaginationFactory } from '../crud-gen.args.js';
import {
  FilterType,
  GeneralFilters,
  Operators,
  SortDirection,
} from '../crud-gen.enum.js';
import { getEntityRelations } from '../crud-gen.helpers.js';
import {
  DateFilterModel,
  FilterInput,
  ICrudGenBaseParams,
  IFilterExpressionsProperty,
  INumberFilterModel,
  ISetFilterModel,
  ISortModel,
  ISortModelStrict,
  ITextFilterModel,
  JoinTypes,
} from './crud-gen-gql.interface.js';

/**
 * @deprecated use sortModelFactory instead
 */
@InputType()
export class SortModel<T = any> implements ISortModel<T> {
  colId!: string;
  @Field(
    /* istanbul ignore next */
    () => SortDirection,
    { nullable: true, defaultValue: 'ASC' },
  )
  sort!: SortDirection;
}

const sortModelCacheMap = new WeakMap();
export function sortModelFactory<Entity>(entityModel: ClassType<Entity>) {
  const cached = sortModelCacheMap.get(entityModel);
  if (cached) return cached;

  const fieldsEnum = entityFieldsEnumGqlFactory(entityModel);
  @InputType(`${entityModel.name}SortModel`)
  class SortModel implements ISortModelStrict<typeof fieldsEnum> {
    @Field(
      /* istanbul ignore next */
      () => fieldsEnum,
    )
    colId!: keyof typeof fieldsEnum;
    @Field(
      /* istanbul ignore next */
      () => SortDirection,
      { nullable: true, defaultValue: 'ASC' },
    )
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

  const FieldEnum = entityFieldsEnumGqlFactory(entityModel);

  @InputType(`${entityModel.name}FilterTextInput`)
  class FilterText implements ITextFilterModel {
    @HideField()
    filterType!: FilterType.TEXT;
    type!: GeneralFilters;
    @Field(
      /* istanbul ignore next */
      () => FieldEnum,
    )
    field!: string;
    filter!: string;
  }

  @InputType(`${entityModel.name}FilterNumberInput`)
  class FilterNumber implements INumberFilterModel {
    @HideField()
    filterType!: FilterType.NUMBER;
    type!: GeneralFilters;
    @Field(
      /* istanbul ignore next */
      () => FieldEnum,
    )
    field!: string;
    filter!: number;
    filterTo?: number;
  }

  @InputType(`${entityModel.name}FilterDateInput`)
  class FilterDate implements DateFilterModel {
    @HideField()
    filterType!: FilterType.DATE;
    type!: GeneralFilters;
    @Field(
      /* istanbul ignore next */
      () => FieldEnum,
    )
    field!: string;
    dateFrom!: string;
    dateTo?: string;
  }

  @InputType(`${entityModel.name}FilterSetInput`)
  class FilterSet implements ISetFilterModel {
    @HideField()
    filterType!: FilterType.SET;
    values!: string[];
    @Field(
      /* istanbul ignore next */
      () => FieldEnum,
    )
    field!: string;
  }

  /**
   * Since union for input types are not possible yet, we need this type
   * @see https://github.com/graphql/graphql-spec/issues/488
   */
  @InputType(`${entityModel.name}FilterInput`)
  class FilterExpressionProperty implements IFilterExpressionsProperty {
    @Field(
      /* istanbul ignore next */
      () => FilterText,
      { nullable: true },
    )
    [FilterType.TEXT]!: FilterText;
    @Field(
      /* istanbul ignore next */
      () => FilterNumber,
      { nullable: true },
    )
    [FilterType.NUMBER]!: FilterNumber;
    @Field(
      /* istanbul ignore next */
      () => FilterDate,
      { nullable: true },
    )
    [FilterType.DATE]!: FilterDate;
    @Field(
      /* istanbul ignore next */
      () => FilterSet,
      { nullable: true },
    )
    [FilterType.SET]!: FilterSet;
  }

  @InputType(`${entityModel.name}FilterExpressionInput`)
  class FilterExpression implements FilterInput {
    @Field(
      /* istanbul ignore next */
      () => Operators,
      { defaultValue: Operators.AND, nullable: true },
    )
    operator?: Operators;
    @Field(
      /* istanbul ignore next */
      () => [FilterExpressionProperty],
    )
    expressions?: FilterExpressionProperty[];
    @Field(
      /* istanbul ignore next */
      () => [FilterExpression],
    )
    childExpressions?: FilterInput[];
  }

  filterExpressionInputCache.set(entityModel, FilterExpression);

  return FilterExpression;
}

// memoize pre-generated InputType
const JoinOptionInputCache = new WeakMap();
export function agJoinArgFactory<Entity>(
  entityModel: ClassType<Entity>,
  defaultValues?: ICrudGenBaseParams,
) {
  // return memoized result if any
  const cached = JoinOptionInputCache.get(entityModel);
  if (cached) return cached;

  const resolverInfoList = getEntityRelations(entityModel);

  if (!resolverInfoList.length) return null;

  @InputType(`${entityModel.name}JoinInputTypePartial`)
  class JoinInput {
    @Field(
      /* istanbul ignore next */
      () => JoinTypes,
    )
    joinType?: JoinTypes;
  }

  registerEnumType(JoinTypes, {
    name: `JoinTypes`,
  });

  @InputType(`${entityModel.name}JoinOptionsInputType`)
  class JoinOptionInput {
    [index: string]: ClassType;
  }

  resolverInfoList.forEach((r) => {
    const type = r.relation.type;
    if (typeof type !== 'string') {
      const typeClass = (type as AnyFunction)();
      @InputType(`${entityModel.name}${r.relation.propertyName}JoinInputType`)
      class JoinFullInput extends IntersectionType(
        JoinInput,
        crudGenParamsNoPaginationFactory(defaultValues, typeClass),
      ) {}

      JoinOptionInput.prototype[r.relation.propertyName] = JoinFullInput;
      Field(
        /* istanbul ignore next */
        () => JoinFullInput,
        { nullable: true },
      )(JoinOptionInput.prototype, r.relation.propertyName);
    }
  });

  JoinOptionInputCache.set(entityModel, JoinOptionInput);

  return JoinOptionInput;
}
