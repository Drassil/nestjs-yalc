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
import { SkeletonPhone } from '../persistance/skeleton-phone.entity';
import returnValue from '@nestjs-yalc/utils/returnValue';

@ObjectType()
@AgGridObject()
export class SkeletonUserType extends SkeletonUser {
  @AgGridField({
    gqlType: /* istanbul ignore next */ () => SkeletonPhone,
    // relation: {
    //   relationType: 'one-to-many',
    // },
  })
  SkeletonPhone?: SkeletonPhone[];

  @HideField()
  password: string;

  @AgGridField({
    isRequired: true,
  })
  guid: string;

  @AgGridField({
    gqlType: returnValue(String),
    gqlOptions: {
      name: 'fullName',
    },
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
