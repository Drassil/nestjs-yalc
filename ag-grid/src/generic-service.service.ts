import {
  ConditionsTooBroadError,
  NoResultsFoundError,
} from './conditions.error';
import {
  CreateEntityError,
  DeleteEntityError,
  EntityError,
  UpdateEntityError,
} from './entity.error';
import { getConnectionName } from '@nestjs-yalc/database/conn.helper';
import { FactoryProvider, Injectable } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import {
  DeepPartial,
  getConnection,
  ObjectLiteral,
  QueryFailedError,
} from 'typeorm';
import { FindConditions } from 'typeorm';
import { FindManyOptions } from 'typeorm';
import { AgGridRepository } from '@nestjs-yalc/ag-grid/ag-grid.repository';
import { AgGridFindManyOptions } from '@nestjs-yalc/ag-grid/ag-grid.interface';
import { ClassType } from '@nestjs-yalc/types/globals';
import { getProviderToken } from './ag-grid.helpers';

/**
 *
 * @todo must be refactorized with better types
 *
 * Factory function, creates a Provider for the specified Service class, entity and connection
 * @param providedClass Service Class name or Type
 * @param entity TypeORM Entity
 * @param connectionName The Database connection name
 */
export function GenericServiceFactory<Entity>(
  entity: EntityClassOrSchema,
  connectionName: string,
  providedClass?: ClassType<GenericService<Entity>>,
): FactoryProvider {
  const serviceClass = providedClass ?? GenericService;

  return {
    provide:
      providedClass ??
      getServiceToken(
        typeof entity === 'function' ? entity.name : entity.toString(),
      ),
    useFactory: (repository: AgGridRepository<any>) => {
      return new serviceClass(repository);
    },
    inject: [getRepositoryToken(entity, connectionName)],
  };
}

export function getServiceToken(entity: ClassType | string) {
  return `${getProviderToken(entity)}GenericService`;
}

/**
 * Validates if the error generated is related to the TypeORM Create/Update/Delete operation and re-throw it as a custom error.
 * @param errorClass The custom error class to throw
 * @throws EntityError
 */
export function validateSupportedError(
  errorClass: new (error: Error) => EntityError,
) {
  return (error: Error) => {
    if (error instanceof QueryFailedError) {
      throw new errorClass(error);
    }
    throw error;
  };
}

/**
 * @todo must be refactorized with better types
 */
@Injectable()
export class GenericService<Entity> {
  protected entity: EntityClassOrSchema;

  constructor(protected repository: AgGridRepository<Entity>) {
    // Extracts the target Entity from the AgGridRepository
    this.entity = repository.target as EntityClassOrSchema;
  }

  /**
   * Switches this Service database connection to a new specified database
   * @param dbName The database name
   */
  protected switchDatabaseConnection(dbName: string): void {
    const connectionName = getConnectionName(dbName);
    const connection = getConnection(connectionName);
    this.setRepository(
      connection.getRepository(this.entity) as AgGridRepository<Entity>,
    );
  }

  /**
   * Changes the Service repository
   * @param repository
   */
  protected setRepository(repository: AgGridRepository<Entity>): void {
    this.repository = repository;
  }

  /**
   * Returns the Service repository
   */
  getRepository(): AgGridRepository<Entity> {
    return this.repository;
  }

  /**
   * Returns a List of entities based in the provided options.
   * @param findOptions Filter options
   * @param withCount whether or not the number results should be returned
   * @param relations Related entities to load as part of the results
   * @param databaseName The database name, to open a new database connection
   */
  async getEntityList(
    findOptions: FindManyOptions<Entity> | ObjectLiteral,
    withCount?: false,
    relations?: string[],
    databaseName?: string,
  ): Promise<Entity[]>;
  async getEntityList(
    findOptions: FindManyOptions<Entity> | ObjectLiteral,
    withCount: true,
    relations?: string[],
    databaseName?: string,
  ): Promise<[Entity[], number]>;
  async getEntityList(
    findOptions: FindManyOptions<Entity> | ObjectLiteral,
    withCount = false,
    relations?: string[],
    databaseName?: string,
  ): Promise<[Entity[], number] | Entity[]> {
    // Allows to switch to a different database connection
    if (databaseName) this.switchDatabaseConnection(databaseName);
    if (relations) findOptions.relations = relations;

    return withCount
      ? this.repository.findAndCount(findOptions)
      : this.repository.find(findOptions);
  }

  /**
   * Shortcut of getEntity with  failOnNull = true
   * @see {@link getEntity} for further information
   */
  async getEntityOrFail(
    where:
      | FindConditions<Entity>[]
      | FindConditions<Entity>
      | ObjectLiteral
      | string,
    fields?: (keyof Entity)[],
    relations?: string[],
    databaseName?: string,
  ): Promise<Entity> {
    return this.getEntity(where, fields, relations, databaseName, {
      failOnNull: true,
    });
  }

  /**
   * Returns an entity, or entity fields, based in the filters provided
   * @param where Filter options
   * @param fields Specific Entity fields to retrieve
   * @param relations Related entities to load as part of the Entity
   * @param databaseName The database name, to open a new database connection
   */
  async getEntity(
    where:
      | FindConditions<Entity>[]
      | FindConditions<Entity>
      | ObjectLiteral
      | string,
    fields?: (keyof Entity)[],
    relations?: string[],
    databaseName?: string,
    options?: {
      failOnNull: false;
    },
  ): Promise<Entity | undefined>;
  async getEntity(
    where:
      | FindConditions<Entity>[]
      | FindConditions<Entity>
      | ObjectLiteral
      | string,
    fields?: (keyof Entity)[],
    relations?: string[],
    databaseName?: string,
    options?: {
      failOnNull?: boolean;
    },
  ): Promise<Entity>;
  async getEntity(
    where:
      | FindConditions<Entity>[]
      | FindConditions<Entity>
      | ObjectLiteral
      | string,
    fields?: (keyof Entity)[],
    relations?: string[],
    databaseName?: string,
    options?: {
      failOnNull?: boolean;
    },
  ): Promise<Entity | undefined> {
    // Allows to switch to a different database connection
    if (databaseName) this.switchDatabaseConnection(databaseName);

    return options?.failOnNull === false
      ? this.repository.findOne({ where, select: fields, relations })
      : this.repository.findOneOrFail({ where, select: fields, relations });
  }

  /**
   * Creates an entity based in the provided data and returns it
   * @param entity
   * @throws CreateEntityError
   */
  async createEntity(entity: DeepPartial<Entity>): Promise<Entity> {
    const newEntity = this.repository.create(entity);
    const { identifiers } = await this.repository
      .insert(newEntity)
      .catch(validateSupportedError(CreateEntityError));

    return this.getEntityOrFail(identifiers[0]);
  }

  /**
   * Updates an entity based in the provided conditions and return the updated entity
   * @param conditions The conditions to update
   * @param input The data to update
   * @throws UpdateEntityError
   * @throws NoResultsForConditions
   * @throws ConditionsTooBroadError
   */
  async updateEntity(
    conditions: FindConditions<Entity>,
    input: DeepPartial<Entity>,
  ): Promise<Entity> {
    await this.validateConditions(conditions);

    await this.repository
      .update(conditions, input)
      .catch(validateSupportedError(UpdateEntityError));

    return this.getEntityOrFail(input);
  }

  /**
   * Deletes an entity based in the provided conditions and returns wether or not the resource was deleted
   * @param conditions The conditions to delete
   * @throws DeleteEntityError
   * @throws NoResultsForConditions
   * @throws ConditionsTooBroadError
   */
  async deleteEntity(conditions: FindConditions<Entity>): Promise<boolean> {
    await this.validateConditions(conditions);

    const result = await this.repository
      .delete(conditions)
      .catch(validateSupportedError(DeleteEntityError));

    return !!result.affected && result.affected > 0;
  }

  /**
   * Makes sure that the conditions will affect a single record
   * @param conditions
   * @throws NoResultsForConditions
   * @throws ConditionsTooBroadError
   */
  async validateConditions(conditions: FindConditions<Entity>): Promise<void> {
    const results = await this.repository.find({
      where: conditions,
      take: 2, // Prevent finding more records than we need for the validation
    });

    if (results.length === 0) {
      throw new NoResultsFoundError(conditions);
    }
    if (results.length > 1) {
      throw new ConditionsTooBroadError(conditions);
    }
  }

  /**   * Returns a List of entities based in the provided options.
   * @param findOptions Filter options
   * @param withCount whether or not the number results should be returned
   * @param relations Related entities to load as part of the results
   * @param databaseName The database name, to open a new database connection
   */
  async getEntityListAgGrid(
    findOptions: AgGridFindManyOptions<Entity>,
    withCount?: false,
    relations?: string[],
    databaseName?: string,
  ): Promise<Entity[]>;
  async getEntityListAgGrid(
    findOptions: AgGridFindManyOptions<Entity>,
    withCount: true,
    relations?: string[],
    databaseName?: string,
  ): Promise<[Entity[], number]>;
  async getEntityListAgGrid(
    findOptions: AgGridFindManyOptions<Entity>,
    withCount = false,
    relations?: string[],
    databaseName?: string,
  ): Promise<[Entity[], number] | Entity[]> {
    // Allows to switch to a different database connection
    if (databaseName) this.switchDatabaseConnection(databaseName);
    if (relations) findOptions.relations = relations;

    return withCount
      ? this.repository.getManyAndCountAgGrid(findOptions)
      : this.repository.getManyAgGrid(findOptions);
  }
}
