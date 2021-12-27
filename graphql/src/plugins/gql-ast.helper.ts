import { FieldNode, SelectionNode } from "graphql";

export class GqlASTHelper {
  static filterFieldNodes(selections: SelectionNode[]): FieldNode[] {
    return selections.filter<FieldNode>(GqlASTHelper.isFieldNode);
  }

  static isFieldNode(selectionNode: SelectionNode): selectionNode is FieldNode {
    return selectionNode.kind === "Field";
  }
}
