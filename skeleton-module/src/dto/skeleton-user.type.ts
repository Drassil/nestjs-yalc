import {
  HideField,
  InputType,
  ObjectType,
  OmitType,
  PartialType,
} from '@nestjs/graphql';
import {
  AgGridField,
  AgGridObject,
} from '@nestjs-yalc/ag-grid/object.decorator';
import { SkeletonUser } from '../persistance/skeleton-user.entity';
import returnValue from '@nestjs-yalc/utils/returnValue';
import { UUIDScalar } from '@nestjs-yalc/graphql/scalars/uuid.scalar';
import { SkeletonPhoneType } from './skeleton-phone.type';

@ObjectType()
@AgGridObject()
export class SkeletonUserType extends SkeletonUser {
  @AgGridField<SkeletonPhoneType>({
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
  @AgGridField({
    gqlType: returnValue(UUIDScalar),
    gqlOptions: {
      name: 'ID',
      description: 'The user ID generated with UUID',
    },
    isRequired: true,
  })
  guid: string;

  @AgGridField({
    dst: `CONCAT(firstName,' ', lastName)`,
    mode: 'derived',
    isSymbolic: true,
  })
  fullName: string;
}

/**
 * Here all the input type for Graphql
 */
@InputType()
@AgGridObject()
export class SkeletonUserCreateInput extends OmitType(
  SkeletonUserType,
  ['SkeletonPhone'] as const,
  InputType,
) {}

@InputType()
@AgGridObject({ copyFrom: SkeletonUserType })
export class SkeletonUserCondition extends PartialType(
  SkeletonUserCreateInput,
  InputType,
) {}

@InputType()
@AgGridObject({ copyFrom: SkeletonUserType })
export class SkeletonUserUpdateInput extends OmitType(
  SkeletonUserType,
  ['guid', 'SkeletonPhone'] as const,
  InputType,
) {}
