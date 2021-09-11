import { SelectionNode } from 'graphql';
import { GqlASTHelper } from './gql-ast.helper';

describe('GraphQL AST helper functions', () => {
  it('should not process filter FieldNodes in a list of SelectionNode', () => {
    const noFieldNodes: SelectionNode[] = [
      {
        kind: 'FragmentSpread',
        name: { kind: 'Name', value: 'NON_FIELD_NODE' },
      },
    ];

    const singleFieldNode: SelectionNode[] = [
      {
        kind: 'FragmentSpread',
        name: { kind: 'Name', value: 'NON_FIELD_NODE_1' },
      },
      {
        kind: 'Field',
        name: { kind: 'Name', value: 'FIELD_NODE' },
      },
      {
        kind: 'InlineFragment',
        selectionSet: {
          kind: 'SelectionSet',
          selections: [
            {
              kind: 'Field',
              name: { kind: 'Name', value: 'InlineFragment_FIELD_NODE' },
            },
          ],
        },
      },
    ];

    const allFieldNodeInput: SelectionNode[] = [
      {
        kind: 'Field',
        name: { kind: 'Name', value: 'FIELD_NODE' },
      },
      {
        kind: 'Field',
        name: { kind: 'Name', value: 'FIELD_NODE' },
      },
      {
        kind: 'Field',
        name: { kind: 'Name', value: 'FIELD_NODE' },
      },
    ];

    const testInputs: Array<[SelectionNode[], number]> = [
      [noFieldNodes, 0],
      [singleFieldNode, 1],
      [allFieldNodeInput, allFieldNodeInput.length],
    ];

    testInputs.forEach(([input, expectedSize]) => {
      const result = GqlASTHelper.filterFieldNodes(input);
      expect(result.length).toBe(expectedSize);
    });
  });
});
