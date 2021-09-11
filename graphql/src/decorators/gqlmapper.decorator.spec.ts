jest.mock('@nestjs/graphql');

import * as gqlMapper from './gqlmapper.decorator';
import {
  mockedExecutionContext,
  mockedNestGraphql,
} from '@nestjs-yalc/jest/common-mocks.helper';
import * as graphql from '@nestjs/graphql';

const stringValue = 'thisIsAString';
const fixedDataObj = { exposed: { dst: stringValue } };
const fixedInfoObj = {
  original: stringValue,
};
describe('Graphql decorator test', () => {
  const mockCreate = (mockedNestGraphql.GqlExecutionContext.create = jest.fn());
  mockCreate.mockImplementation(() => ({
    getArgs: jest.fn().mockReturnValue(fixedInfoObj),
  }));
  it('Check GqlAgGridFieldsAsArgsWorker without changing', async () => {
    const testData = gqlMapper.GqlAgGridFieldsAsArgsWorker(
      fixedDataObj,
      fixedInfoObj,
    );

    expect(testData).toEqual(fixedInfoObj);
  });
  it('Check GqlAgGridFieldsAsArgsWorker with change', async () => {
    const testData = gqlMapper.GqlAgGridFieldsAsArgsWorker(fixedDataObj, {
      exposed: stringValue,
    });

    expect(testData).toEqual({ [stringValue]: stringValue });
  });

  it('Check GqlArgsGenerator with data', async () => {
    jest
      .spyOn(gqlMapper, 'GqlAgGridFieldsAsArgsWorker')
      .mockReturnValue({ data: 'noData' });
    const testData = gqlMapper.GqlArgsGenerator(
      fixedDataObj,
      mockedExecutionContext,
    );

    expect(testData).toEqual({ data: 'noData' });
  });

  it('Check GqlArgsGenerator without data', async () => {
    const testData = gqlMapper.GqlArgsGenerator(null, mockedExecutionContext);

    expect(testData).toEqual(fixedInfoObj);
  });

  it('should be able to use the InputArgs to combine param decorators', () => {
    const ArgsFunc = jest.spyOn(graphql, 'Args');
    const returnFunc = jest.fn().mockReturnValue('somestring');
    ArgsFunc.mockReturnValue(returnFunc);
    const decorator = gqlMapper.InputArgs({ fieldMap: {} });
    expect(decorator).toEqual(expect.any(Function));
    decorator('', '', 0);
    expect(returnFunc).toHaveBeenCalled();
  });
});
