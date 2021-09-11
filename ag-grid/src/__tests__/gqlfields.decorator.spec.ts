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

const infoObj = {
  fieldNodes: [
    {
      selectionSet: {
        selections: [
          {
            name: {
              value: 'first',
            },
          },
          {
            name: {
              value: 'second',
            },
          },
          {
            name: {
              value: 'nodes',
            },
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'sub',
                  },
                },
                {
                  name: {
                    value: 'subToChange',
                  },
                },
                {
                  name: {
                    value: 'node',
                  },
                  selectionSet: {
                    selections: [
                      {
                        name: {
                          value: 'sub2',
                        },
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
            },
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'sub',
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

const edgesObj = {
  fieldNodes: [
    {
      selectionSet: {
        selections: [
          {
            name: {
              value: 'edges',
            },
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'node',
                  },
                  selectionSet: {
                    selections: [
                      {
                        name: {
                          value: 'fieldAlias',
                        },
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
    const mockCreate = (mockedNestGraphql.GqlExecutionContext.create = jest.fn());
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
    const GqlFieldsMapperTest = $.GqlFieldsMapper(arr, infoObj);

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
    const GqlFieldsMapperTest = $.GqlFieldsMapper(arr, infoObj);

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
    const GqlFieldsMapperTest = $.GqlFieldsMapper(arr, edgesObj);

    expect(GqlFieldsMapperTest).toEqual([]);
  });
});
