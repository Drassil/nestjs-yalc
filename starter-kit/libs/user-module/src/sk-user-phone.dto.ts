import { InputType, ObjectType, OmitType, PartialType } from '@nestjs/graphql';
import {
  ModelField,
  ModelObject,
} from '@nestjs-yalc/crud-gen/object.decorator.js';
import { SkeletonPhone } from './sk-phone.entity.js';
import { UUIDScalar } from '@nestjs-yalc/graphql/scalars/uuid.scalar.js';
import returnValue from '@nestjs-yalc/utils/returnValue.js';
import { SkeletonUserType } from './sk-user.dto.js';

@ObjectType()
@ModelObject()
export class SkeletonPhoneType extends SkeletonPhone {
  @ModelField({
    gqlType: /* istanbul ignore next */ () => SkeletonUserType,
    // relation: {
    //   relationType: 'one-to-many',
    // },
  })
  SkeletonUser?: SkeletonUserType;

  @ModelField({ gqlType: returnValue(UUIDScalar) })
  userId: string;
}

/**
 * Here all the input type for Graphql
 */
@InputType()
@ModelObject()
export class SkeletonPhoneCreateInput extends OmitType(
  SkeletonPhoneType,
  ['SkeletonUser'] as const,
  InputType,
) {}

@InputType()
@ModelObject({ copyFrom: SkeletonPhoneType })
export class SkeletonPhoneCondition extends PartialType(
  SkeletonPhoneCreateInput,
  InputType,
) {}

@InputType()
@ModelObject({ copyFrom: SkeletonPhoneType })
export class SkeletonPhoneUpdateInput extends OmitType(
  SkeletonPhoneType,
  ['userId', 'SkeletonUser'] as const,
  InputType,
) {}
