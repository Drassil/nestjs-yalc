import { ModelField } from '@nestjs-yalc/crud-gen/object.decorator.js';
import { EntityWithTimestamps } from '@nestjs-yalc/database/timestamp.entity.js';
import { ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { SkeletonPhone } from './skeleton-phone.entity.js';

@Entity('skeleton-user')
@ObjectType({ isAbstract: true })
export class SkeletonUser extends EntityWithTimestamps(BaseEntity) {
  @PrimaryColumn('varchar', { name: 'guid', length: 36 })
  guid: string;

  @Column('varchar')
  firstName: string;

  @Column('varchar')
  lastName: string;

  @Column('varchar', { unique: true })
  email: string;

  @Column('varchar')
  password: string;

  // This configuration can't be moved in DTO
  // because it instructs TypeORM on how to select
  // the resource
  @ModelField({
    dst: `CONCAT(firstName,' ', lastName)`,
    mode: 'derived',
    isSymbolic: true,
  })
  // virtual column, not selectable
  // handled by the @ModelField
  @Column({
    select: false,
    insert: false,
    update: false,
    type: 'varchar',
  })
  fullName: string;

  @OneToMany(
    /* istanbul ignore next */
    () => SkeletonPhone,
    /* istanbul ignore next */
    (meta) => meta.SkeletonUser,
  )
  @JoinColumn([{ name: 'guid', referencedColumnName: 'userId' }])
  SkeletonPhone?: SkeletonPhone[];
}
