import { IFieldMapper } from '@nestjs-yalc/interfaces';
import { ClassType } from '@nestjs-yalc/types/globals';
import {
  addFieldMetadata,
  FieldOptions,
  ReturnTypeFunc,
} from '@nestjs/graphql';
import 'reflect-metadata';
import { RelationType } from 'typeorm/metadata/types/RelationTypes';
import { IAgQueryParams } from './ag-grid.args';

export interface IAgGridFieldOptions {
  dst?: string;
  src?: string;
  /**
   * if true, this property will be used to add the field to the list of
   * the required fields even though the client do not ask for it
   * It is particulary useful when you need to use foreign keys
   */
  isRequired?: boolean;
  /**
   * if true, this property will be ignored by the aggrid filters
   * It is particulary useful when you need to use special data in your endpoint
   */
  isSymbolic?: boolean;
  /**
   * if denyFilter is true, this property can't be used as a filter
   */
  denyFilter?: boolean;
}

export interface IAgGridFieldMetadata<T = any> extends IAgGridFieldOptions {
  /**
   * Nestjs/graphQL Field decorator options
   */
  gqlType?: ReturnTypeFunc;
  gqlOptions?: FieldOptions;
  /**
   * To specify if it's a resource that can be loaded with a dataLoader
   */
  dataLoader?: {
    defaultValue?: IAgQueryParams<T>;
    searchKey: string;
    relationType: RelationType;
    type: { (): ClassType };
  };
}

export const AGGRID_OBJECT_METADATA_KEY = Symbol('AGGRID_OBJECT_METADATA_KEY');
export const AGGRID_FIELD_METADATA_KEY = Symbol('AGGRID_FIELD_METADATA_KEY');

export const AgGridField = <T = any>({
  gqlType,
  gqlOptions,
  ...options
}: IAgGridFieldMetadata<T>): PropertyDecorator => {
  return (target: any, property: string | symbol) => {
    const classConstructor = target.constructor;

    const propertyName = property.toString();

    const metadata = getAgGridFieldMetadataList(classConstructor) ?? {};

    metadata[propertyName] = {
      dst: propertyName,
      src: gqlOptions?.name ?? propertyName,
      ...options,
    };

    Reflect.defineMetadata(
      AGGRID_FIELD_METADATA_KEY,
      metadata,
      classConstructor,
    );

    // graphql field metadata
    if (gqlOptions || gqlType) {
      addFieldMetadata(
        <ReturnTypeFunc>gqlType ?? <FieldOptions>gqlOptions,
        gqlOptions ?? {},
        target,
        propertyName,
      );
    }
  };
};

export const getAgGridFieldMetadataList = (
  target: Record<string, unknown> | ClassType,
): { [key: string]: IAgGridFieldMetadata } | undefined => {
  return Reflect.getMetadata(AGGRID_FIELD_METADATA_KEY, target);
};

export const hasAgGridFieldMetadataList = (
  target: Record<string, unknown> | ClassType,
): boolean => {
  return Reflect.hasMetadata(AGGRID_FIELD_METADATA_KEY, target);
};

export const getAgGridFieldMetadata = (
  target: Record<string, unknown> | ClassType,
  propertyName: string | symbol,
): IAgGridFieldMetadata | undefined => {
  const metadata = getAgGridFieldMetadataList(target);

  const name = propertyName.toString();

  if (!metadata || !metadata[name]) return undefined;

  return metadata[name];
};

export const hasAgGridFieldMetadata = (
  target: Record<string, unknown> | ClassType,
  propertyName: string,
): boolean => {
  const metadata = Reflect.getMetadata(AGGRID_FIELD_METADATA_KEY, target);

  return metadata && !!metadata[propertyName];
};

export const AgGridObject = (options?: AgGridObjectOptions): ClassDecorator => {
  return (target) => {
    let metadata = options ?? {};

    if (metadata.copyFrom) {
      const copyFrom = metadata.copyFrom;
      metadata = { ...metadata, ...getAgGridObjectMetadata(copyFrom) };

      const fieldMetadata = getAgGridFieldMetadataList(copyFrom);

      Reflect.defineMetadata(AGGRID_FIELD_METADATA_KEY, fieldMetadata, target);
    }

    Reflect.defineMetadata(
      AGGRID_OBJECT_METADATA_KEY,
      metadata,
      target.constructor,
    );
  };
};

export const getAgGridObjectMetadata = (
  target: Record<string, unknown> | ClassType,
): FilterOption => {
  return Reflect.getMetadata(AGGRID_OBJECT_METADATA_KEY, target.constructor);
};

export const hasAgGridObjectMetadata = (
  target: Record<string, unknown> | ClassType,
): boolean => {
  return Reflect.hasMetadata(AGGRID_OBJECT_METADATA_KEY, target.constructor);
};

/**
 * The options below allow to implement an include/exclude mechanism for mapped fields.
 * It can be used to deny the usage of certain fields
 */
export enum FilterOptionType {
  /** include fields specified inside the array of fields and exclude all the others */
  INCLUDE = 'include',
  /** exclude fields specified inside the array of fields and include all the others */
  EXCLUDE = 'exclude',
}

export type FilterOption = {
  type: FilterOptionType;
  fields: string[];
};

export type AgGridObjectOptions = {
  /**
   * Copy agGrid decorator metadata from another class
   * Useful when the classes are similar but they don't share the prototype
   * E.G. when you use OmitType or similar techniques
   */
  copyFrom?: ClassType;
  filters?: FilterOption;
};

export interface IFieldAndFilterMapper {
  field: IFieldMapper;
  //When filterOption is set we can manage filters on fields with an inclusion/exclusion strategy
  filterOption?: FilterOption;
}
