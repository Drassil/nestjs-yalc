import {
  QueryBuilderHelper,
  ReplicationMode,
} from "@nestjs-yalc/database/query-builder.helper";
import { IFieldMapper } from "@nestjs-yalc/interfaces/maps.interface";
import { ClassType } from "@nestjs-yalc/types";
import { EntityClassOrSchema } from "@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type";
import {
  EntityRepository,
  FindOptionsUtils,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import { whereObjectToSqlString } from "./ag-grid.helpers";
import { AgGridFindManyOptions } from "./ag-grid.interface";

export class AgGridRepository<Entity> extends Repository<Entity> {
  protected entity: EntityClassOrSchema;

  /**
   * @todo we should create a class helper/adapter for the findOptions and move this method there
   */
  public getActualLimits(findOptions: AgGridFindManyOptions<Entity>): {
    skip?: number;
    take?: number;
  } {
    if (findOptions.subQueryFilters) {
      // findOptions limits take precedence over subQuery limits
      return {
        skip: findOptions.skip ?? findOptions.subQueryFilters.skip,
        take: findOptions.take ?? findOptions.subQueryFilters.take,
      };
    }

    return { skip: findOptions.skip, take: findOptions.take };
  }

  public getFormattedAgGridQueryBuilder(
    findOptions: AgGridFindManyOptions<Entity>,
    fieldMap?: {
      parent: IFieldMapper;
      joined: IFieldMapper | { [key: string]: IFieldMapper };
    },
    qb?: SelectQueryBuilder<Entity>
  ): SelectQueryBuilder<Entity> {
    //We will use functions to apply sorting and filters
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      order,
      where,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      info,
      skip,
      take,
      extra,
      ...strippedFindOptions
    } = findOptions;

    let queryBuilder = qb ?? this.createQueryBuilder();

    queryBuilder =
      FindOptionsUtils.applyFindManyOptionsOrConditionsToQueryBuilder<Entity>(
        queryBuilder,
        strippedFindOptions
      );

    if (extra && extra.rawLimit === true) {
      // .take() and .skip() methods create
      // a not limited subquery on joined tables
      // which reduces the performance, while offset() and limit()
      // do not create any subquery, however, the amount of data retrieved could
      // not be consistent (less than the one expected) because of duplicated rows
      // therefore, use rawLimit option especially with 1:1 relations
      queryBuilder.offset(skip).limit(take);
    } else {
      queryBuilder.skip(skip).take(take);
    }

    if (where) {
      const stringWhere = whereObjectToSqlString(
        queryBuilder,
        where,
        queryBuilder.alias,
        fieldMap
      );

      //Let's convert the filterObject into an sql string
      queryBuilder.where(stringWhere);
    }

    //We do the same with sorting
    const sortingColumns = QueryBuilderHelper.applyOrderToJoinedQueryBuilder(
      findOptions,
      queryBuilder.alias,
      fieldMap
    );
    sortingColumns.forEach((v: any) => {
      queryBuilder.addOrderBy(v.key, v.operator);
    });
    return queryBuilder;
  }

  public getAgGridQueryBuilder(
    findOptions: AgGridFindManyOptions<Entity>,
    fieldMap?: {
      parent: IFieldMapper;
      joined: IFieldMapper | { [key: string]: IFieldMapper };
    }
  ) {
    const queryBuilder = this.createQueryBuilder();

    if (findOptions.subQueryFilters) {
      const joinQueryBuilder = queryBuilder.connection.createQueryBuilder();

      const subQuery = this.getFormattedAgGridQueryBuilder(
        findOptions.subQueryFilters,
        fieldMap
      ).select("*");

      joinQueryBuilder.from(`(${subQuery.getQuery()})`, queryBuilder.alias);

      // bug: https://github.com/typeorm/typeorm/issues/4015
      // hack: https://github.com/typeorm/typeorm/issues/4015#issuecomment-691030543
      if (
        joinQueryBuilder.expressionMap.mainAlias &&
        queryBuilder.expressionMap.mainAlias?.metadata
      )
        joinQueryBuilder.expressionMap.mainAlias.metadata =
          queryBuilder.expressionMap.mainAlias.metadata;

      return this.getFormattedAgGridQueryBuilder(
        findOptions,
        fieldMap,
        joinQueryBuilder
      );
    }

    return this.getFormattedAgGridQueryBuilder(
      findOptions,
      fieldMap,
      queryBuilder
    );
  }

  /**
   * Returns a List of entities based in the provided options.
   * @param findOptions Filter options
   */
  public async getManyAndCountAgGrid(
    findOptions: AgGridFindManyOptions<Entity>,
    fieldMap?: {
      parent: IFieldMapper;
      joined: IFieldMapper | { [key: string]: IFieldMapper };
    }
  ): Promise<[Entity[], number]> {
    // console.log('==========START QUERY==============');
    const queryBuilder = this.getAgGridQueryBuilder(findOptions, fieldMap);

    const { skip = 0, take } = this.getActualLimits(findOptions);

    // skip count select with no limit is specified or when skipCount is true
    const skipCount =
      findOptions.extra?.skipCount === true || !findOptions.take;

    if (skipCount) {
      const result = await queryBuilder.getMany();

      // when no limit specified we are asking for all available resources, hence we already know the total amount
      // therefore, no SELECT COUNT is needed
      const knownLimit = !take || result.length < take;
      // we still try to return a counter when we know that the requested limit
      // is higher than the resources available. Otherwise we return -1 (unkown limit)
      return [result, knownLimit ? result.length + skip : -1];
    } else {
      //getManyAndCount in unefficient because is sequential, instead we can run the 2 queries in parallel
      return Promise.all([queryBuilder.getMany(), queryBuilder.getCount()]);
    }
  }

  /**
   * Returns a List of entities based in the provided options.
   * @param findOptions Filter options
   */
  public async getManyAgGrid(
    findOptions: AgGridFindManyOptions<Entity>,
    fieldMap?: {
      parent: IFieldMapper;
      joined: IFieldMapper | { [key: string]: IFieldMapper };
    }
  ): Promise<Entity[]> {
    // console.log('==========START QUERY==============');
    const queryBuilder = this.getAgGridQueryBuilder(findOptions, fieldMap);

    return queryBuilder.getMany();
  }

  async getOneAgGrid(
    findOptions: AgGridFindManyOptions<Entity>,
    withFail?: boolean,
    mode?: ReplicationMode
  ): Promise<Entity>;
  async getOneAgGrid(
    findOptions: AgGridFindManyOptions<Entity>,
    withFail?: boolean,
    mode: ReplicationMode = ReplicationMode.SLAVE
  ): Promise<Entity | undefined> {
    // console.log('==========START QUERY==============');
    const queryBuilder = this.getFormattedAgGridQueryBuilder(findOptions);
    const returnFunction = withFail
      ? qbGetOneOrFail(findOptions)
      : qbGetOne(findOptions);

    return QueryBuilderHelper.applyOperationToQueryBuilder(
      queryBuilder,
      mode,
      returnFunction
    );
  }
}

export function qbGetOne<Entity>(conditions: any) {
  return (qb: SelectQueryBuilder<Entity>) => qb.where(conditions).getOne();
}

export function qbGetOneOrFail<Entity>(conditions: any) {
  return (qb: SelectQueryBuilder<Entity>) =>
    qb.where(conditions).getOneOrFail();
}

const repositoryMap = new WeakMap();

export function AgGridRepositoryFactory<Entity>(
  entity: ClassType<Entity>
): ClassType<AgGridRepository<Entity>> {
  let cached;
  if ((cached = repositoryMap.get(entity))) return cached;

  const dynamicClass = (name: string) =>
    ({ [name]: class extends AgGridRepository<Entity> {} }[name]);

  const repo: ClassType<AgGridRepository<Entity>> = dynamicClass(
    `${entity.name}Repository`
  );

  EntityRepository(entity)(repo);

  repositoryMap.set(entity, repo);

  return repo;
}
