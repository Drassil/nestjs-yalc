import {
  AgGridField,
  AgGridObject,
} from '@nestjs-yalc/ag-grid/object.decorator';
import { EntityWithTimestamps } from '@nestjs-yalc/database/timestamp.entity';
import { UUIDScalar } from '@nestjs-yalc/graphql/scalars/uuid.scalar';
import returnValue from '@nestjs-yalc/utils/returnValue';
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
@ObjectType()
@AgGridObject()
export class SkeletonUser extends EntityWithTimestamps(BaseEntity) {
  @AgGridField({ gqlType: returnValue(UUIDScalar) })
  @PrimaryColumn('varchar', { name: 'guid', length: 36 })
  guid: string;

  @Column('varchar')
  firstName: string;

  @Column('varchar')
  lastName: string;

  @OneToMany(
    /* istanbul ignore next */
    () => SkeletonPhone,
    /* istanbul ignore next */
    (meta) => meta.SkeletonUser,
  )
  @JoinColumn([{ name: 'guid', referencedColumnName: 'userId' }])
  SkeletonPhone?: SkeletonPhone[];
}
