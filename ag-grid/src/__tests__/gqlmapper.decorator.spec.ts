jest.mock('@nestjs/graphql');

import * as gqlMapper from '../gqlmapper.decorator';
import {
  mockedExecutionContext,
  mockedNestGraphql,
} from '@nestjs-yalc/jest/common-mocks.helper';
import * as graphql from '@nestjs/graphql';
import { AgGridField, AgGridObject } from '../object.decorator';

@AgGridObject()
class DummyType {
  @AgGridField({ gqlOptions: { name: 'betterName' } })
  dummyProp: string;
}

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
  it('Check GqlFieldsAsArgsWorker without changing', async () => {
    const testData = gqlMapper.GqlFieldsAsArgsWorker(
      fixedDataObj,
      fixedInfoObj,
    );

    expect(testData).toEqual(fixedInfoObj);
  });
  it('Check GqlFieldsAsArgsWorker with change', async () => {
    const testData = gqlMapper.GqlFieldsAsArgsWorker(fixedDataObj, {
      exposed: stringValue,
    });

    expect(testData).toEqual({ [stringValue]: stringValue });
  });

  it('Check GqlArgsGenerator with data', async () => {
    jest
      .spyOn(gqlMapper, 'GqlFieldsAsArgsWorker')
      .mockReturnValue({ data: 'noData' });
    const testData = gqlMapper.GqlArgsGenerator(
      { fieldType: DummyType },
      mockedExecutionContext,
    );

    expect(testData).toEqual({ data: 'noData' });
  });

  it('Check GqlArgsGenerator with data and parameters', async () => {
    jest
      .spyOn(gqlMapper, 'GqlFieldsAsArgsWorker')
      .mockReturnValue({ data: 'noData' });
    const testData = gqlMapper.GqlArgsGenerator(
      { fieldType: DummyType, _name: 'test', gql: { name: 'test' } },
      mockedExecutionContext,
    );

    expect(testData).toEqual({ data: 'noData' });
  });

  it('Check GqlArgsGenerator without data', async () => {
    const testData = gqlMapper.GqlArgsGenerator({}, mockedExecutionContext);

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

  it('should be able to use the InputArgs to combine param decorators with specified params', () => {
    const ArgsFunc = jest.spyOn(graphql, 'Args');
    const returnFunc = jest.fn().mockReturnValue('somestring');
    ArgsFunc.mockReturnValue(returnFunc);
    const decorator = gqlMapper.InputArgs({
      fieldMap: {},
      _name: 'input',
      gql: { name: 'input' },
    });
    expect(decorator).toEqual(expect.any(Function));
    decorator('', '', 0);
    expect(returnFunc).toHaveBeenCalled();
  });
});
