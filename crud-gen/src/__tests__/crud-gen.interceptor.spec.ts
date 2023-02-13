jest.mock('@nestjs/graphql');
jest.mock('rxjs/operators');

import { CallHandler } from '@nestjs/common';
import * as RxjsOperators from 'rxjs/operators';
import {
  CrudGenInterceptor,
  crudGenInterceptorWorker,
} from '../crud-gen.interceptor.js';
import { createMock } from '@golevelup/ts-jest';
import {
  mockedExecutionContext,
  mockedNestGraphql,
} from '@nestjs-yalc/jest/common-mocks.helper.js';

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
        ],
      },
    },
  ],
};

describe('Crud-gen Interceptor test', () => {
  let crudGenInterceptor: CrudGenInterceptor;
  const callHandler = createMock<CallHandler>();
  const mockCreate = (mockedNestGraphql.GqlExecutionContext.create = jest.fn());
  const mockGetArgs = mockCreate.mockImplementation(() => ({
    getArgs: jest.fn().mockReturnValue(infoObj),
  }));

  const connectionRet = { nodes: 1 };

  const endRowTest = {
    startRow: 1,
    endRow: 5,
  };

  const noOffsetTest = {
    ...endRowTest,
    startRow: 0,
    endRow: 0,
  };

  const testReturnsOffset = {
    ...connectionRet,
    pageData: { count: 1, ...endRowTest },
  };

  const testReturnsNoOffset = {
    ...connectionRet,
    pageData: { count: 1, ...noOffsetTest },
  };

  const testReturnsNoParams = {
    ...connectionRet,
    pageData: { count: 1, startRow: 0, endRow: 1 },
  };

  beforeEach(async () => {
    crudGenInterceptor = new CrudGenInterceptor();
  });

  it('t1', async () => {
    const mockMap = jest.spyOn(RxjsOperators, 'map');
    crudGenInterceptor.intercept(mockedExecutionContext, callHandler);

    expect(mockMap).toHaveBeenCalledTimes(1);
    expect(mockedExecutionContext.switchToHttp()).toBeDefined();
    expect(callHandler.handle).toBeCalledTimes(1);
  });

  it('Check CrudGenInterceptorWorker with endRow', async () => {
    const TestedCrudGenInterceptorWorker = crudGenInterceptorWorker(
      endRowTest.startRow,
      endRowTest.endRow,
    );

    expect(TestedCrudGenInterceptorWorker([1, 1])).toEqual(testReturnsOffset);
    expect(mockGetArgs).toHaveBeenCalled();
  });

  it('Check CrudGenInterceptorWorker with no endRow', async () => {
    const TestedCrudGenInterceptorWorker = crudGenInterceptorWorker(
      noOffsetTest.startRow,
      noOffsetTest.endRow,
    );

    expect(TestedCrudGenInterceptorWorker([1, 1])).toEqual(testReturnsNoOffset);
    expect(mockGetArgs).toHaveBeenCalled();
  });

  it('Check CrudGenInterceptorWorker with no pagination', async () => {
    const TestedCrudGenInterceptorWorker = crudGenInterceptorWorker(null, null);

    expect(TestedCrudGenInterceptorWorker([1, 1])).toEqual(testReturnsNoParams);
    expect(mockGetArgs).toHaveBeenCalled();
  });
});
