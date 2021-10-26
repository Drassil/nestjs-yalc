jest.mock('@nestjs/graphql');
jest.mock('@nestjs-yalc/ag-grid/ag-grid.args', () => ({
  agQueryParamsFactory: jest.fn(),
}));

import { IFieldMapper } from '@nestjs-yalc/interfaces/maps.interface';
import * as $ from '../gqlfields.decorator';
import {
  mockedExecutionContext,
  mockedNestGraphql,
} from '@nestjs-yalc/jest/common-mocks.helper';
import { GraphQLResolveInfo } from 'graphql';

const infoObj: GraphQLResolveInfo = {
  fieldNodes: [
    {
      selectionSet: {
        selections: [
          {
            kind: 'Field',
            name: {
              kind: 'Name',
              value: 'first',
            },
          },
          {
            kind: 'Field',
            name: {
              kind: 'Name',
              value: 'second',
            },
          },
          {
            name: {
              value: 'nodes',
              kind: 'Name',
            },
            kind: 'Field',
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  name: {
                    value: 'sub',
                    kind: 'Name',
                  },
                  kind: 'Field',
                },
                {
                  name: {
                    value: 'subToChange',
                    kind: 'Name',
                  },
                  kind: 'Field',
                },
                {
                  name: {
                    value: 'node',
                    kind: 'Name',
                  },
                  kind: 'Field',
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        name: {
                          value: 'sub2',
                          kind: 'Name',
                        },
                        kind: 'Field',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: {
              value: 'node',
              kind: 'Name',
            },
            kind: 'Field',
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  name: {
                    value: 'sub',
                    kind: 'Name',
                  },
                  kind: 'Field',
                },
              ],
            },
          },
        ],
      },
    },
  ],
};

const edgesObj: GraphQLResolveInfo = {
  fieldNodes: [
    {
      selectionSet: {
        selections: [
          {
            name: {
              value: 'edges',
              kind: 'Name',
            },
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'node',
                    kind: 'Name',
                  },
                  selectionSet: {
                    selections: [
                      {
                        name: {
                          value: 'fieldAlias',
                          kind: 'Name',
                        },
                        kind: 'Field',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
};

describe('Graphql decorator test', () => {
  it('Check GqlInfoGenerator', async () => {
    const mockCreate = (mockedNestGraphql.GqlExecutionContext.create =
      jest.fn());
    const mockGetInfo = mockCreate.mockImplementation(() => ({
      getInfo: jest.fn().mockReturnValue(infoObj),
    }));
    const TestGqlInfoGenerator = $.GqlInfoGenerator({}, mockedExecutionContext);

    expect(TestGqlInfoGenerator).toBeDefined();
    expect(mockCreate).toHaveBeenCalled();
    expect(mockGetInfo).toHaveBeenCalled();
  });

  it('Check GqlFieldsMapper Functionality with specified field name', async () => {
    const arr: IFieldMapper = {
      ['first']: { dst: 'specified', isRequired: true },
    };
    const GqlFieldsMapperTest = $.GqlAgGridFieldsMapper(arr, infoObj);

    expect(GqlFieldsMapperTest).toEqual([
      'specified',
      'second',
      'sub',
      'subToChange',
    ]);
  });

  it('Check GqlFieldsMapper Functionality with specified field name to add', async () => {
    const arr: IFieldMapper = {
      ['toAdd']: { dst: 'specified', isRequired: true },
    };
    const GqlFieldsMapperTest = $.GqlAgGridFieldsMapper(arr, infoObj);

    expect(GqlFieldsMapperTest).toEqual([
      'first',
      'second',
      'sub',
      'subToChange',
      'specified',
    ]);
  });

  it('Check GqlAgGridFieldsMapper Functionality with specified field name to add', async () => {
    const arr: IFieldMapper = {
      ['toAdd']: { dst: 'specified', isRequired: true },
      ['subToChange']: { dst: 'toAddSub', isRequired: true },
    };
    const GqlFieldsMapperTest = $.GqlAgGridFieldsMapper(arr, infoObj);

    expect(GqlFieldsMapperTest).toEqual([
      'first',
      'second',
      'sub',
      'toAddSub',
      'specified',
    ]);
  });

  it('Check with nested', async () => {
    const arr: IFieldMapper = { ['first']: { dst: 'specified' } };
    const GqlFieldsMapperTest = $.GqlAgGridFieldsMapper(arr, edgesObj);

    expect(GqlFieldsMapperTest).toEqual([]);
  });
});
