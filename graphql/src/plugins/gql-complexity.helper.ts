import {
  FieldNode,
  DocumentNode,
  isExecutableDefinitionNode,
  SelectionNode,
  GraphQLSchema,
} from 'graphql';
import { GqlASTHelper } from './gql-ast.helper';
import { GqlError, GqlErrorMsgs } from './gql.error';

const MAX_EXECUTABLE_DEFINITIONS = 50;
const MAX_DEPTH = 3;

// GraphQL Object Type returned by queries/mutations/fields that might have a circular dependency.
const returnTypeMap: { [key: string]: string } = {
  ManageUser_getUser: 'UserType',
  ManageUser_getUserGrid: 'UserGrid',
  User: 'UserType', // Temporary solution for wrong type returned by the 'User' in UserEmail object type.
};

interface IVisitedNode {
  /** at which level the field has been visited */
  depth: number;
}

export class GqlComplexityHelper {
  /**
   * We want to avoid circular depencies or queries that are too deep
   * before resolving the GraphQL Request.
   */

  static customMaxDepth: number;

  static processDocumentAST(document: DocumentNode, schema?: GraphQLSchema) {
    document.definitions
      .filter(isExecutableDefinitionNode)
      .forEach((operation) => {
        const { selectionSet } = operation;

        const { name } = selectionSet.selections[0] as FieldNode;
        const queryContext = schema?.getQueryType()?.getFields()[name.value];

        GqlComplexityHelper.customMaxDepth =
          queryContext?.extensions?.complexity ?? MAX_DEPTH;

        const totalOperations = selectionSet.selections.length;
        if (totalOperations > MAX_EXECUTABLE_DEFINITIONS) {
          throw new GqlError(GqlErrorMsgs.MAX_OPERATIONS);
        }

        selectionSet.selections.forEach((selectionNode: SelectionNode) => {
          GqlComplexityHelper.hasInvalidNode(selectionNode);
        });
      });
  }

  static hasInvalidNode(selectionNode: SelectionNode) {
    if (!GqlASTHelper.isFieldNode(selectionNode)) {
      return;
    }

    const selections = selectionNode.selectionSet?.selections?.concat();
    if (selections === undefined) {
      return;
    }

    const defaultVisitedNodes = GqlComplexityHelper.getDefaultVisitedNodes(
      selectionNode.name.value,
    );

    for (const node of GqlASTHelper.filterFieldNodes(selections)) {
      GqlComplexityHelper.findInvalidNode(node, defaultVisitedNodes, 1);
    }
  }

  static findInvalidNode(
    node: FieldNode,
    visitedNodes: { [key: string]: IVisitedNode },
    depth: number,
  ) {
    const { name, selectionSet } = node;
    const { value: fieldName } = name;
    const notNodesField = fieldName !== 'nodes';

    // Process non-captilized request resources should not be supported
    // It's still necessary to visit the selectionSet inside 'nodes' (AgGrid).
    // ID is used as a field name in entities, not a nested resource, it should be skipped.
    const shouldSkipFieldName =
      fieldName === 'ID' ||
      (notNodesField && fieldName[0] !== fieldName.toUpperCase()[0]);

    if (shouldSkipFieldName) {
      return;
    }

    const foundVisitedNode =
      visitedNodes[fieldName] ?? visitedNodes[returnTypeMap[fieldName]];
    if (foundVisitedNode && foundVisitedNode.depth !== depth) {
      throw new GqlError(GqlErrorMsgs.CIRCULAR_DEPENDENCY_FOUND);
    }

    if (notNodesField) visitedNodes[fieldName] = { depth };

    if (selectionSet) {
      if (notNodesField) depth++;

      if (depth > GqlComplexityHelper.customMaxDepth) {
        throw new GqlError(GqlErrorMsgs.MAX_DEPTH);
      }

      return GqlComplexityHelper.processSelectionNodes(
        selectionSet.selections.concat(),
        visitedNodes,
        depth,
      );
    }
  }

  static getDefaultVisitedNodes(key: string): { [key: string]: IVisitedNode } {
    const result: { [key: string]: IVisitedNode } = {};
    const operationReturnType: string | undefined = returnTypeMap[key];

    if (operationReturnType) {
      result[operationReturnType] = { depth: 0 };
    }

    return result;
  }

  static processSelectionNodes(
    selections: SelectionNode[],
    visitedNodes: { [key: string]: IVisitedNode },
    depth: number,
  ) {
    for (const node of GqlASTHelper.filterFieldNodes(selections)) {
      GqlComplexityHelper.findInvalidNode(node, visitedNodes, depth);
    }
  }
}
