import { createParamDecorator, ExecutionContext, Type } from "@nestjs/common";
import { GqlExecutionContext, ReturnTypeFuncValue } from "@nestjs/graphql";
import {
  IFieldMapper,
  FieldMapperProperty,
} from "@nestjs-yalc/interfaces/maps.interface";
import {
  columnConversion,
  objectToFieldMapper,
} from "@nestjs-yalc/ag-grid/ag-grid.helpers";
import { ClassType } from "@nestjs-yalc/types/globals";
import { GraphQLResolveInfo } from "graphql";

export interface IGqlAgSingleParams {
  id: Type<any>;
}

export const GqlAgGridFieldsMapper = (
  data: IFieldMapper | ReturnTypeFuncValue | ClassType,
  info: GraphQLResolveInfo
): string[] => {
  const fieldMapper = objectToFieldMapper(data);

  const keys: Array<string> = [];
  info.fieldNodes?.[0].selectionSet?.selections.forEach((item: any) => {
    if (item.selectionSet) {
      if (item.name.value === "nodes") {
        item.selectionSet.selections.forEach((subItem: any) => {
          if (subItem.selectionSet) return;

          keys.push(
            columnConversion(fieldMapper.field, subItem.name.value).toString()
          );
        });
      }
      return;
    }

    keys.push(columnConversion(fieldMapper.field, item.name.value).toString());
  });

  // add required fields that have not been selected by the client
  Object.values(fieldMapper.field).forEach((v: FieldMapperProperty) => {
    if (v.isRequired && keys.indexOf(v.dst) < 0) keys.push(v.dst);
  });

  return keys;
};

export const GqlInfoGenerator = (
  data: IFieldMapper | ReturnTypeFuncValue | ClassType = {},
  ctx: ExecutionContext
) => {
  const gqlCtx = GqlExecutionContext.create(ctx);
  const info = gqlCtx.getInfo();
  return GqlAgGridFieldsMapper(data, info);
};

export const GqlFieldsMap = createParamDecorator(GqlInfoGenerator);
