import { objectToFieldMapper } from "@nestjs-yalc/ag-grid/ag-grid.helpers";
import { IFieldMapper } from "@nestjs-yalc/interfaces/maps.interface";
import { ClassType } from "@nestjs-yalc/types";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import {
  Args,
  ArgsOptions,
  GqlExecutionContext,
  ReturnTypeFuncValue,
} from "@nestjs/graphql";
import { ObjectLiteral } from "typeorm";

interface IInputArgsOptions {
  /**
   * @property Options for the nestjs Args decorator
   */
  gql?: ArgsOptions;
  /**
   * @property fieldMap is used internally to convert names of exposed fields to database fields
   * @deprecated use fieldType instead
   */
  fieldMap?: IFieldMapper | undefined;
  /**
   * @property fieldType is used internally to retrieve information about the returned type
   */
  fieldType?: ClassType | ReturnTypeFuncValue;
  /**
   * @property the input property name, by default is 'input'
   */
  _name?: string;
}

export const GqlFieldsAsArgsWorker = (
  data: IFieldMapper,
  info: ObjectLiteral
) => {
  const keys: ObjectLiteral = {};
  for (const key of Object.keys(info)) {
    keys[data[key] ? data[key].dst : key] = info[key];
  }
  return keys;
};

export const GqlArgsGenerator = (
  data: IInputArgsOptions,
  ctx: ExecutionContext
) => {
  const gqlCtx = GqlExecutionContext.create(ctx);
  const args = gqlCtx.getArgs();

  const fieldType = data.fieldType ?? data.fieldMap;

  if (fieldType) {
    const fieldMapperAndFilter = objectToFieldMapper(fieldType);

    return GqlFieldsAsArgsWorker(
      fieldMapperAndFilter.field,
      args[data.gql?.name ?? data._name ?? "input"]
    );
  }

  return args;
};

export const InputArgsMapper = createParamDecorator(GqlArgsGenerator);

/**
 * This decorator declare the Args name for the playground, at the same time it applies the fieldMap to the Object
 * @returns the mapped params in the input object
 */
export const InputArgs = (params: IInputArgsOptions) => {
  const args = Args(params._name ?? "input", params.gql ?? {});
  const mapper = InputArgsMapper(params);
  return function (target: any, key: string, index: number) {
    args(target, key, index);
    mapper(target, key, index);
  };
};
