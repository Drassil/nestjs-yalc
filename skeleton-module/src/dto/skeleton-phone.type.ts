import { InputType, ObjectType, OmitType, PartialType } from '@nestjs/graphql';
import { AgGridField, AgGridObject } from 'crud-gen/src/object.decorator';
import { SkeletonPhone } from '../persistance/skeleton-phone.entity';
import { UUIDScalar } from '@nestjs-yalc/graphql/scalars/uuid.scalar';
import returnValue from '@nestjs-yalc/utils/returnValue';
import { SkeletonUserType } from './skeleton-user.type';

@ObjectType()
@AgGridObject()
export class SkeletonPhoneType extends SkeletonPhone {
  @AgGridField({
    gqlType: /* istanbul ignore next */ () => SkeletonUserType,
    // relation: {
    //   relationType: 'one-to-many',
    // },
  })
  SkeletonUser?: SkeletonUserType;

  @AgGridField({ gqlType: returnValue(UUIDScalar) })
  userId: string;
}

/**
 * Here all the input type for Graphql
 */
@InputType()
@AgGridObject()
export class SkeletonPhoneCreateInput extends OmitType(
  SkeletonPhoneType,
  ['SkeletonUser'] as const,
  InputType,
) {}

@InputType()
@AgGridObject({ copyFrom: SkeletonPhoneType })
export class SkeletonPhoneCondition extends PartialType(
  SkeletonPhoneCreateInput,
  InputType,
) {}

@InputType()
@AgGridObject({ copyFrom: SkeletonPhoneType })
export class SkeletonPhoneUpdateInput extends OmitType(
  SkeletonPhoneType,
  ['userId', 'SkeletonUser'] as const,
  InputType,
) {}
