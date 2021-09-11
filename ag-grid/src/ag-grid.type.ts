import { ObjectType, Field, HideField } from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import { FindManyOptions, FindOperator } from 'typeorm';
import returnValue from '@nestjs-yalc/utils/returnValue';
import { ICombinedWhereModel } from './ag-grid.interface';
import { Operators } from './ag-grid.enum';
import { IExtraArg } from './ag-grid-args.decorator';

@ObjectType()
export class PageDataAgGrid {
  @Field()
  public count!: number;

  @Field()
  public startRow!: number;

  @Field()
  public endRow!: number;
}

export interface IConnection {
  name: string;
  nodes: any[];
  pageData: PageDataAgGrid;
}

export const typeMap: {
  [key: string]: { new (name: string): IConnection };
} = {};
export default function AgGridGqlType<T>(type: Type<T>): any {
  const { name } = type;
  if (typeMap[`${name}`]) return typeMap[`${name}`];

  @ObjectType(`${name}Connection`, { isAbstract: true })
  class Connection implements IConnection {
    @HideField() // internally used
    public name = `${name}Connection`;

    @Field(returnValue([type]), { nullable: true })
    public nodes!: T[];
    @Field(returnValue(PageDataAgGrid), { nullable: true })
    public pageData!: PageDataAgGrid;
  }
  typeMap[`${name}`] = Connection;

  return typeMap[`${name}`];
}

export type findOperatorTypes = string | number | Date | undefined;

export interface IGqlSelectedFields<T> {
  fields: (keyof T)[];
}

export interface IAgGridArgs<T>
  extends FindManyOptions,
    IGqlSelectedFields<T> {}

export interface RecursiveFindOperator<T> {
  [index: number]: RecursiveFindOperator<T> | FindOperator<T>;
  length: number;
}

export interface RecursiveAndFindOperator<T> {
  condition_1?: RecursiveAndFindOperator<T> | FindOperator<T>;
  condition_2?: RecursiveAndFindOperator<T> | FindOperator<T>;
}

export type IWhereConditionType =
  | FindOperator<findOperatorTypes>
  | FindOperator<findOperatorTypes>[]
  | RecursiveFindOperator<findOperatorTypes>
  | RecursiveFindOperator<findOperatorTypes>[]
  | RecursiveAndFindOperator<findOperatorTypes>
  | RecursiveAndFindOperator<findOperatorTypes>[]
  | ICombinedWhereModel;

export type IWhereFilters = {
  [key: string]: IWhereConditionType;
};

export interface IWhereCondition {
  operator?: Operators;
  filters: IWhereFilters;
  childExpressions?: IWhereCondition[];
}

export interface IFilterArg {
  key: string;
  value: findOperatorTypes;
  descriptors?: IExtraArg;
}
