import { Controller } from '@nestjs/common';
import { DeepPartial, FindConditions, Repository } from 'typeorm';

@Controller()
export class KafkaController<Entity> {
  constructor(protected repository: Repository<Entity>) {}

  protected setRepository(repository: Repository<Entity>): void {
    this.repository = repository;
  }

  /**
   * Check function for filtering target with specific value on a key
   * @param target Entity
   * @param key Key of the Entity fields
   * @param value Value to filter
   * @returns true if match - false otherwise
   */
  checkTargetValue<Entity, U extends keyof Entity>(
    target: Entity,
    key: U,
    value: Array<Entity[U]>,
  ): boolean {
    return value.includes(target[key]);
  }

  /**
   * Save entity on Database
   * @param entity
   * @returns
   */
  saveEntity(entity: DeepPartial<Entity>) {
    return this.repository.insert(entity);
  }

  /**
   * Save the entity or Update in case of confitColumn
   * @param entity
   * @param overWrite
   * @param conflitTarget
   * @returns
   */
  saveEntityOrUpdate(
    entity: DeepPartial<Entity>,
    overWrite: string[],
    conflitTarget?: string | string[],
  ) {
    return this.repository
      .createQueryBuilder()
      .insert()
      .values(entity)
      .orUpdate(overWrite, conflitTarget)
      .execute();
  }

  /**
   * Delete the entity
   * @param conditions
   * @returns
   */
  deleteEntity(conditions: FindConditions<Entity>) {
    return this.repository.delete(conditions);
    /**
     * Place repository for deleting the entity
     */
  }
}
