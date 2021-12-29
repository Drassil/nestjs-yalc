/* istanbul ignore file */

//TODO Complete the implementation of the switch connection, create and initialize dynamicaly the WalletRepository
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import {
  AbstractRepository,
  Connection,
  CustomRepositoryCannotInheritRepositoryError,
  CustomRepositoryNotFoundError,
  getMetadataArgsStorage,
  Repository,
} from 'typeorm';

export class RepositoryHelper {
  static getCustomRepository<Entity extends EntityClassOrSchema>(
    connection: Connection,
    entity: Entity,
  ) {
    const entityRepositoryMetadataArgs =
      getMetadataArgsStorage().entityRepositories.find(function (repository) {
        return repository.target === entity.constructor;
      });

    if (!entityRepositoryMetadataArgs)
      throw new CustomRepositoryNotFoundError(entity);

    const entityMetadata = entityRepositoryMetadataArgs.entity
      ? connection.getMetadata(entityRepositoryMetadataArgs.entity)
      : undefined;
    const entityRepositoryInstance =
      new (entityRepositoryMetadataArgs.target as any)(this, entityMetadata);

    // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
    // however we need these properties for internal work of the class
    if (entityRepositoryInstance instanceof AbstractRepository) {
      if (!(entityRepositoryInstance as any)['manager'])
        (entityRepositoryInstance as any)['manager'] = this;
    }
    if (entityRepositoryInstance instanceof Repository) {
      if (!entityMetadata)
        throw new CustomRepositoryCannotInheritRepositoryError(entity);

      (entityRepositoryInstance as any)['manager'] = this;
      (entityRepositoryInstance as any)['metadata'] = entityMetadata;
    }

    return entityRepositoryInstance;
  }
}
