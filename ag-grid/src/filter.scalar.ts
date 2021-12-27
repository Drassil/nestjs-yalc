import { Scalar, CustomScalar } from "@nestjs/graphql";
import { Kind, ValueNode } from "graphql";
import {
  isCombinedFilterModel,
  isFilterModel,
  isMulticolumnJoinOptions,
} from "./ag-grid-type-checker.utils";
import { CustomWhereKeys } from "./ag-grid.enum";
import { AgGridBadFilterTypeError } from "./ag-grid.error";
import {
  FilterInput,
  IFilterInputOld,
  IMultiColumnJoinOptions,
} from "./ag-grid.interface";

@Scalar("FilterInput")
export class FilterScalar implements CustomScalar<string, FilterInput> {
  description = "AG-Grid Filter scalar type";

  resultMemoize = new Map();
  resultMemoizeInverse = new WeakMap();

  parseValue(value: string): FilterInput {
    // value from the client
    const cached = this.resultMemoize.get(value);
    if (cached) return cached;

    const parsedValue = JSON.parse(value);

    const normalizeInput = (
      input: IFilterInputOld | IMultiColumnJoinOptions
    ): FilterInput => {
      const _normalizedInput: FilterInput = {
        expressions: [],
      };

      Object.keys(input).forEach((key) => {
        const field = input[key];
        if (
          key === CustomWhereKeys.MULTICOLUMNJOINOPTIONS &&
          isMulticolumnJoinOptions(field)
        ) {
          _normalizedInput.childExpressions = [
            {
              ...normalizeInput(field),
              operator: field.multiColumnJoinOperator,
            },
          ];
          return;
        }

        if (
          _normalizedInput.expressions &&
          (isFilterModel(field) || isCombinedFilterModel(field))
        ) {
          _normalizedInput.expressions.push({
            [field.filterType]: {
              ...field,
              field: key,
              filterType: field.filterType,
            },
          });
        }
      });

      return _normalizedInput;
    };

    const filter = normalizeInput(parsedValue);

    this.resultMemoize.set(value, filter);
    this.resultMemoizeInverse.set(filter, value);

    return filter;
  }

  serialize(value: FilterInput | string): string {
    return typeof value === "string"
      ? value
      : this.resultMemoizeInverse.get(value);
  }

  parseLiteral(ast: ValueNode): FilterInput | null {
    if (ast.kind === Kind.STRING) {
      return this.parseValue(ast.value);
    }
    throw new AgGridBadFilterTypeError();
  }
}
