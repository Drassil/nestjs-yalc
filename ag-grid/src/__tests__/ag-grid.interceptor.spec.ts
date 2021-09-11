jest.mock('@nestjs/graphql');
jest.mock('rxjs/operators');

import { CallHandler } from '@nestjs/common';
import * as RxjsOperators from 'rxjs/operators';
import {
  AgGridInterceptor,
  agGridInterceptorWorker,
} from '../ag-grid.interceptor';
import { createMock } from '@golevelup/ts-jest';
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
        ],
      },
    },
  ],
};

describe('AG-Grid Interceptor test', () => {
  let agGridInterceptor: AgGridInterceptor;
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
    agGridInterceptor = new AgGridInterceptor();
  });

  it('t1', async () => {
    const mockMap = jest.spyOn(RxjsOperators, 'map');
    agGridInterceptor.intercept(mockedExecutionContext, callHandler);

    expect(mockMap).toHaveBeenCalledTimes(1);
    expect(mockedExecutionContext.switchToHttp()).toBeDefined();
    expect(callHandler.handle).toBeCalledTimes(1);
  });

  it('Check AgGridInterceptorWorker with endRow', async () => {
    const TestedAgGridInterceptorWorker = agGridInterceptorWorker(
      endRowTest.startRow,
      endRowTest.endRow,
    );

    expect(TestedAgGridInterceptorWorker([1, 1])).toEqual(testReturnsOffset);
    expect(mockGetArgs).toHaveBeenCalled();
  });

  it('Check AgGridInterceptorWorker with no endRow', async () => {
    const TestedAgGridInterceptorWorker = agGridInterceptorWorker(
      noOffsetTest.startRow,
      noOffsetTest.endRow,
    );

    expect(TestedAgGridInterceptorWorker([1, 1])).toEqual(testReturnsNoOffset);
    expect(mockGetArgs).toHaveBeenCalled();
  });

  it('Check AgGridInterceptorWorker with no pagination', async () => {
    const TestedAgGridInterceptorWorker = agGridInterceptorWorker(null, null);

    expect(TestedAgGridInterceptorWorker([1, 1])).toEqual(testReturnsNoParams);
    expect(mockGetArgs).toHaveBeenCalled();
  });
});
