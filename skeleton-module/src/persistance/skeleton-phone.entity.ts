import { AgGridObject } from '@nestjs-yalc/ag-grid/object.decorator';
import { EntityWithTimestamps } from '@nestjs-yalc/database/timestamp.entity';
import { ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SkeletonUser } from './skeleton-user.entity';

@Entity('skeleton-phone')
@Index('unique_phone', ['phoneNumber', 'userId'], { unique: true })
@ObjectType()
@AgGridObject()
export class SkeletonPhone extends EntityWithTimestamps(BaseEntity) {
  // if not specifiec elsewhere
  // ID field name will be used by default from the single
  // resource get query as argument to use to select the resource
  @PrimaryGeneratedColumn('increment')
  ID: number;

  @Column('varchar', { length: 20 })
  phoneNumber: string;

  @Column('varchar', { length: 36 })
  userId: string;

  @OneToOne(
    /* istanbul ignore next */
    () => SkeletonUser,
    /* istanbul ignore next */
    (meta) => meta.SkeletonPhone,
  )
  @JoinColumn([{ name: 'userId', referencedColumnName: 'guid' }])
  SkeletonUser?: SkeletonUser;
}
