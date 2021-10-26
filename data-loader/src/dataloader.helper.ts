import * as _DataLoader from 'dataloader';
import { FindAndCountResult } from '@nestjs-yalc/database/query-builder.helper';
import { AgGridFindManyOptions } from '@nestjs-yalc/ag-grid/ag-grid.interface';
import { In } from 'typeorm';
import { IWhereCondition } from '@nestjs-yalc/ag-grid/ag-grid.type';
import { Operators } from '@nestjs-yalc/ag-grid/ag-grid.enum';
import {
  FactoryProvider,
  NotAcceptableException,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import {
  GenericService,
  getServiceToken,
} from '@nestjs-yalc/ag-grid/generic-service.service';
import { ClassType } from '@nestjs-yalc/types/globals';
import { getProviderToken } from '@nestjs-yalc/ag-grid/ag-grid.helpers';

export type SearchKeyType<E, T = string> = [keyof E, T] | T | undefined;

/**
 * Only used internally to add extra data to the Dataloader result
 */
class _DataLoaderWithCount<
  Entity extends Record<string, any>,
> extends _DataLoader<string, Entity[], string> {
  private count: number;

  constructor(
    batchFn: (
      findManyOptions: AgGridFindManyOptions<Entity>,
    ) => Promise<FindAndCountResult<Entity>>,
    searchKey: keyof Entity,
    findOptions: AgGridFindManyOptions<Entity>,
    options?: _DataLoader.Options<string, Entity[], string>,
  ) {
    super(async (keys: Readonly<string[]>): Promise<Entity[][]> => {
      // we force the filter based on dataloader keys
      const where: IWhereCondition = {
        filters: { [searchKey]: In([...keys]) },
      };

      // then, we apply the filters selected by the user with the AND operator
      // but we first must be sure that the filters or the childExpressions
      // are specified, otherwise we will have an empty where condition and a SQL error
      if (
        findOptions.where &&
        ((findOptions.where.filters &&
          Object.keys(findOptions.where.filters).length) ||
          findOptions.where.childExpressions)
      ) {
        where.childExpressions = [
          {
            operator: Operators.AND,
            ...findOptions.where,
          },
        ];
      }

      // searchKey must be part of the selection, otherwise we cannot associate
      // the keys to their values later
      const selections = Array.isArray(findOptions.select)
        ? findOptions.select
        : [];

      if (selections.indexOf(searchKey) === -1) {
        selections.push(searchKey);
        findOptions.select = selections;
      }

      // this is needed for joined and nested queries
      for (const field in findOptions.order) {
        if (selections.indexOf(field) === -1) {
          selections.push(field);
        }
      }

      const findManyOptions: AgGridFindManyOptions = {
        ...findOptions,
        where,
      };

      const [entities, count] = await batchFn(findManyOptions);

      this.count = count;

      // this loop is needed to associate the result of the query with the
      // keys of the dataloader.
      // the dataloader only accepts a result expressed as: <key, elements[]>[]
      // following the order of the requested keys
      const entityMap: { [key: string]: Entity[] } = {};
      entities.forEach((result) => {
        if (typeof entityMap[result[searchKey]] === 'undefined') {
          entityMap[result[searchKey]] = [result];
        } else {
          entityMap[result[searchKey]].push(result);
        }
      });

      return keys.map((key) => entityMap[key] ?? []);
    }, options);
  }

  getCount() {
    return this.count;
  }
}

/**
 * This class creates different dataloaders based on the query path
 * in order to support GraphQL aliases
 */
export class GQLDataLoader<Entity extends Record<string, any> = any> {
  private count = 0;
  private batchFn;
  private searchKey: keyof Entity;
  private options;
  private dataLoaders: {
    [key: string]: _DataLoaderWithCount<Entity>;
  } = {};
  /**
   * to cache generated dataloader keys
   */
  private keyMap: WeakMap<AgGridFindManyOptions, string>;

  constructor(
    getFn: (
      findManyOptions: AgGridFindManyOptions<Entity>,
    ) => Promise<FindAndCountResult<Entity>>,
    searchKey: keyof Entity,
    options?: _DataLoader.Options<string, Entity[], string>,
  ) {
    this.batchFn = getFn;
    this.searchKey = searchKey;
    this.options = options;
    this.keyMap = new WeakMap();
  }

  public getSearchKey() {
    return this.searchKey;
  }

  private getDataloader(
    findOptions: AgGridFindManyOptions<Entity>,
    searchKey: keyof Entity,
  ): _DataLoaderWithCount<Entity> {
    let DLKey = this.keyMap.get(findOptions);

    if (!DLKey) {
      // concat different information to create a proper dataloader key
      DLKey = `${findOptions.select?.sort?.().join(',')}|${JSON.stringify(
        findOptions.where ?? { filters: {} },
      )}|${JSON.stringify(findOptions.subQueryFilters)}|${JSON.stringify(
        findOptions.order ?? {},
      )}|${searchKey}`;

      this.keyMap.set(findOptions, DLKey);
    }

    if (this.dataLoaders.hasOwnProperty(DLKey)) {
      return this.dataLoaders[DLKey];
    }

    const dataLoader = new _DataLoaderWithCount(
      this.batchFn,
      searchKey,
      findOptions,
      this.options,
    );

    this.dataLoaders[DLKey] = dataLoader;

    return dataLoader;
  }

  getCount() {
    return this.count;
  }

  async loadOne(
    key: SearchKeyType<Entity>,
    findOptions: AgGridFindManyOptions<Entity>,
    throwOnNotFound: boolean,
  ): Promise<Entity | null>;
  async loadOne(
    key: SearchKeyType<Entity>,
    findOptions: AgGridFindManyOptions<Entity>,
    throwOnNotFound?: false,
  ): Promise<Entity | null>;
  async loadOne(
    key: SearchKeyType<Entity>,
    findOptions: AgGridFindManyOptions<Entity>,
    throwOnNotFound = false,
  ): Promise<Entity | null> {
    const result = await this.loadOneToMany(key, findOptions, false);

    if (!Array.isArray(result) || result.length === 0) {
      if (throwOnNotFound)
        throw new NotFoundException(`Resource with key ${key} was not found`);
      else return null;
    }

    if (result.length > 1) {
      throw new NotAcceptableException(
        `Resource with key ${key} has more than one association`,
      );
    }

    return result[0];
  }

  async loadOneToMany(
    key: SearchKeyType<Entity>,
    findOptions: AgGridFindManyOptions<Entity>,
    withCount: false,
  ): Promise<Entity[]>;
  async loadOneToMany(
    key: SearchKeyType<Entity>,
    findOptions: AgGridFindManyOptions<Entity>,
    withCount?: true,
  ): Promise<FindAndCountResult<Entity>>;
  async loadOneToMany(
    key: SearchKeyType<Entity>,
    findOptions: AgGridFindManyOptions<Entity>,
    withCount = true,
  ): Promise<FindAndCountResult<Entity> | Entity[]> {
    const keyValue = Array.isArray(key) ? key[1] : key;
    const keyName = Array.isArray(key) ? key[0] : this.searchKey;

    // check if null or undefined
    if (keyValue === undefined || keyValue === null) return [];

    const dataloader = this.getDataloader(findOptions, keyName);
    if (withCount)
      return [await dataloader.load(keyValue), dataloader.getCount()];

    return dataloader.load(keyValue);
  }
}

export const getFn =
  <Entity>(service: GenericService<Entity>) =>
  async (findManyOptions: AgGridFindManyOptions) => {
    return service.getEntityListAgGrid(findManyOptions, true);
  };

export function DataLoaderFactory<Entity>(
  defaultSearchKey: keyof Entity,
  entity: ClassType,
  serviceToken?: string,
): FactoryProvider {
  return {
    provide: getDataloaderToken(entity.name),
    useFactory: (service: GenericService<Entity>) => {
      return new GQLDataLoader<Entity>(
        getFn<Entity>(service),
        defaultSearchKey,
      );
    },
    inject: [serviceToken ?? getServiceToken(entity)],
    scope: Scope.REQUEST,
  };
}

export function getDataloaderToken(entity: ClassType | string) {
  return `${getProviderToken(entity)}Dataloader`;
}
