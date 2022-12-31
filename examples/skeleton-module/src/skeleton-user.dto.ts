import {
  HideField,
  InputType,
  ObjectType,
  OmitType,
  PartialType,
} from '@nestjs/graphql';
import {
  CrudGenField,
  CrudGenObject,
} from '@nestjs-yalc/crud-gen/object.decorator';
import { SkeletonUser } from './skeleton-user.entity';
import returnValue from '@nestjs-yalc/utils/returnValue';
import { UUIDScalar } from '@nestjs-yalc/graphql/scalars/uuid.scalar';
import { SkeletonPhoneType } from './skeleton-phone.dto';

@ObjectType()
@CrudGenObject()
export class SkeletonUserType extends SkeletonUser {
  @CrudGenField<SkeletonPhoneType>({
    relation: {
      type: () => SkeletonPhoneType,
      relationType: 'one-to-many',
      sourceKey: { dst: 'guid', alias: 'guid' },
      targetKey: { dst: 'userId', alias: 'userId' },
    },
  })
  SkeletonPhone?: SkeletonPhoneType[];

  @HideField()
  password: string;

  // guid should be always required in SQL queries to make sure that the relation
  // is always resolved, and it should be exposed as a UUID Scalar to GraphQL
  @CrudGenField({
    gqlType: returnValue(UUIDScalar),
    gqlOptions: {
      name: 'ID',
      description: 'The user ID generated with UUID',
    },
    isRequired: true,
  })
  guid: string;

  @CrudGenField({
    gqlOptions: {
      description: "It's the combination of firstName and lastName",
    },
    denyFilter: true,
  })
  fullName: string;
}

/**
 * Here all the input type for Graphql
 */
@InputType()
@CrudGenObject()
export class SkeletonUserCreateInput extends OmitType(
  SkeletonUserType,
  ['SkeletonPhone', 'fullName', 'createdAt', 'updatedAt'] as const,
  InputType,
) {}

@InputType()
@CrudGenObject({ copyFrom: SkeletonUserType })
export class SkeletonUserCondition extends PartialType(
  SkeletonUserCreateInput,
  InputType,
) {}

@InputType()
@CrudGenObject({ copyFrom: SkeletonUserType })
export class SkeletonUserUpdateInput extends OmitType(
  SkeletonUserType,
  ['guid', 'SkeletonPhone', 'fullName', 'createdAt', 'updatedAt'] as const,
  InputType,
) {}
