jest.mock('@nestjs/graphql');
jest.mock('@nestjs-yalc/crud-gen/crud-gen.args', () => ({
  agQueryParamsFactory: jest.fn(),
}));

import { IFieldMapper } from '@nestjs-yalc/interfaces/maps.interface';
import * as $ from '../gqlfields.decorator';
import * as AgGridHelper from '../crud-gen.helpers';
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
            kind: 'Field',
            name: {
              kind: 'Name',
              value: 'pageData',
            },
            selectionSet: {},
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
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: {
                          value: 'nodes',
                          kind: 'Name',
                        },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [],
                        },
                      },
                    ],
                  },
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
              value: 'subQuery',
              kind: 'Name',
            },
            kind: 'Field',
            selectionSet: {
              kind: 'SelectionSet',
              selections: [],
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
                {
                  name: {
                    value: 'otherField',
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

const nodesObj: GraphQLResolveInfo = {
  fieldNodes: [
    {
      selectionSet: {
        selections: [
          {
            name: {
              value: 'nodes',
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
                {
                  name: {
                    value: 'otherField',
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

const fieldAndFilterMapper = {
  field: {
    node: {
      dst: 'id',
      gqlType: undefined,
      gqlOptions: undefined,
      mode: 'derived',
      isRequired: true,
      _propertyName: 'id',
    },
    first: {
      dst: 'first',
      gqlType: undefined,
      gqlOptions: undefined,
      mode: 'derived',
      isRequired: true,
      _propertyName: 'first',
    },
  },
  extraInfo: {
    node: { field: {}, extraInfo: {}, filterOption: {} },
  },
};

describe('Graphql decorator test', () => {
  // beforeEach(() => {
  //   jest.resetAllMocks();
  // });

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

  it('Check GqlInfoGenerator with default value', async () => {
    const mockCreate = (mockedNestGraphql.GqlExecutionContext.create = jest.fn());
    const mockGetInfo = mockCreate.mockImplementation(() => ({
      getInfo: jest.fn().mockReturnValue(infoObj),
    }));
    const TestGqlInfoGenerator = $.GqlInfoGenerator(
      undefined,
      mockedExecutionContext,
    );

    expect(TestGqlInfoGenerator).toBeDefined();
    expect(mockCreate).toHaveBeenCalled();
    expect(mockGetInfo).toHaveBeenCalled();
  });

  it('Check GqlFieldsMapper Functionality with specified field name', async () => {
    const arr: IFieldMapper = {
      ['first']: { dst: 'specified', isRequired: true },
    };
    const GqlFieldsMapperTest = $.GqlAgGridFieldsMapper(arr, infoObj);

    expect(GqlFieldsMapperTest.keys).toEqual(
      expect.arrayContaining(['specified']),
    );
    expect(GqlFieldsMapperTest.keys).not.toEqual(
      expect.arrayContaining(['first']),
    );
  });

  it('Check GqlFieldsMapper Functionality with nodes', async () => {
    const arr: IFieldMapper = { ['otherField']: { dst: 'specified' } };

    const GqlFieldsMapperTest = $.GqlAgGridFieldsMapper(arr, nodesObj);

    console.log(GqlFieldsMapperTest.keys);
    expect(GqlFieldsMapperTest.keys).toEqual(['specified']);
  });

  it('Check GqlFieldsMapper Functionality with specified field name to add', async () => {
    const arr: IFieldMapper = {
      ['toAdd']: { dst: 'specified', isRequired: true },
    };
    const GqlFieldsMapperTest = $.GqlAgGridFieldsMapper(arr, infoObj);

    expect(GqlFieldsMapperTest.keys).toEqual(
      expect.arrayContaining(['specified']),
    );
    expect(GqlFieldsMapperTest.keys).not.toEqual(
      expect.arrayContaining(['toAdd']),
    );
  });

  it('Check GqlAgGridFieldsMapper Functionality with specified field name to add', async () => {
    const arr: IFieldMapper = {
      ['toAdd']: { dst: 'specified', isRequired: true },
      ['subToChange']: { dst: 'toAddSub', isRequired: true },
    };
    const GqlFieldsMapperTest = $.GqlAgGridFieldsMapper(arr, infoObj);

    expect(GqlFieldsMapperTest.keys).toEqual(
      expect.arrayContaining(['specified', 'toAddSub']),
    );
    expect(GqlFieldsMapperTest.keys).not.toEqual(
      expect.arrayContaining(['toAdd', 'subToChange']),
    );
  });

  it('Check with nested', async () => {
    const arr: IFieldMapper = { ['first']: { dst: 'specified' } };
    jest
      .spyOn(AgGridHelper, 'objectToFieldMapper')
      .mockReturnValue(fieldAndFilterMapper);
    const GqlFieldsMapperTest = $.GqlAgGridFieldsMapper(arr, edgesObj);

    console.log(GqlFieldsMapperTest.keys);
    expect(GqlFieldsMapperTest.keys).toEqual([]);
  });

  it('Check GqlAgGridFieldsMapper with undefined values', () => {
    const arr: IFieldMapper = { ['first']: { dst: 'specified' } };
    const custominfo = {
      fieldNodes: [
        {
          selectionSet: undefined,
        },
      ],
    };
    let GqlFieldsMapperTest = $.GqlAgGridFieldsMapper(arr, custominfo as any);

    expect(GqlFieldsMapperTest.keys).toEqual([]);

    custominfo.fieldNodes = undefined;
    GqlFieldsMapperTest = $.GqlAgGridFieldsMapper(arr, custominfo as any);

    expect(GqlFieldsMapperTest.keys).toEqual([]);
  });

  it('Check GqlAgGridFieldsMapper with derived fields', () => {
    const arr: IFieldMapper = {
      ['node']: { dst: 'data -> $.id', mode: 'derived' },
    };

    jest
      .spyOn(AgGridHelper, 'objectToFieldMapper')
      .mockReturnValue(fieldAndFilterMapper);
    const GqlFieldsMapperTest = $.GqlAgGridFieldsMapper(arr, infoObj);

    expect(GqlFieldsMapperTest).toBeDefined();
  });

  it('Check GqlAgGridFieldsMapper with extraInfo not setted', () => {
    const arr: IFieldMapper = {
      ['node']: { dst: 'data -> $.id', mode: 'derived' },
    };

    jest
      .spyOn(AgGridHelper, 'objectToFieldMapper')
      .mockReturnValue({ ...fieldAndFilterMapper, extraInfo: undefined });
    const GqlFieldsMapperTest = $.GqlAgGridFieldsMapper(arr, infoObj);

    expect(GqlFieldsMapperTest).toBeDefined();
  });
});
