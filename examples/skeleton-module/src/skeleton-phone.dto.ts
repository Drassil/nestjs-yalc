import { InputType, ObjectType, OmitType, PartialType } from '@nestjs/graphql';
import {
  CrudGenField,
  CrudGenObject,
} from '@nestjs-yalc/crud-gen/object.decorator';
import { SkeletonPhone } from '../persistance/skeleton-phone.entity';
import { UUIDScalar } from '@nestjs-yalc/graphql/scalars/uuid.scalar';
import returnValue from '@nestjs-yalc/utils/returnValue';
import { SkeletonUserType } from './skeleton-user.type';

@ObjectType()
@CrudGenObject()
export class SkeletonPhoneType extends SkeletonPhone {
  @CrudGenField({
    gqlType: /* istanbul ignore next */ () => SkeletonUserType,
    // relation: {
    //   relationType: 'one-to-many',
    // },
  })
  SkeletonUser?: SkeletonUserType;

  @CrudGenField({ gqlType: returnValue(UUIDScalar) })
  userId: string;
}

/**
 * Here all the input type for Graphql
 */
@InputType()
@CrudGenObject()
export class SkeletonPhoneCreateInput extends OmitType(
  SkeletonPhoneType,
  ['SkeletonUser'] as const,
  InputType,
) {}

@InputType()
@CrudGenObject({ copyFrom: SkeletonPhoneType })
export class SkeletonPhoneCondition extends PartialType(
  SkeletonPhoneCreateInput,
  InputType,
) {}

@InputType()
@CrudGenObject({ copyFrom: SkeletonPhoneType })
export class SkeletonPhoneUpdateInput extends OmitType(
  SkeletonPhoneType,
  ['userId', 'SkeletonUser'] as const,
  InputType,
) {}
