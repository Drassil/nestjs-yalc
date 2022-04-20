import { EntityWithTimestamps } from '@nestjs-yalc/database/timestamp.entity';
import { ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { SkeletonPhone } from './skeleton-phone.entity';

@Entity('skeleton-user')
@ObjectType({ isAbstract: true })
export class SkeletonUser extends EntityWithTimestamps(BaseEntity) {
  @PrimaryColumn('varchar', { name: 'guid', length: 36 })
  guid: string;

  @Column('varchar')
  firstName: string;

  @Column('varchar')
  lastName: string;

  @Column('varchar')
  email: string;

  @Column('varchar')
  password: string;

  @OneToMany(
    /* istanbul ignore next */
    () => SkeletonPhone,
    /* istanbul ignore next */
    (meta) => meta.SkeletonUser,
  )
  @JoinColumn([{ name: 'guid', referencedColumnName: 'userId' }])
  SkeletonPhone?: SkeletonPhone[];
}
