import {
  expect,
  jest,
  describe,
  it,
  beforeEach,
  beforeAll,
  afterAll,
  afterEach,
} from '@jest/globals';

import { runLambdaCliOperation } from '../aws-lambda.helpers.js';

describe('AWS Lambda Helper', () => {
  it('Should run a lambda cli operation', async () => {
    const mockExec = jest.fn();
    mockExec.mockReturnValueOnce({ stdout: 'success' });
    const result = await runLambdaCliOperation(mockExec, 'test');
    expect(result).toEqual(expect.objectContaining({ statusCode: 200 }));
  });

  it('Should throw an error', async () => {
    const mockExec = jest.fn();
    mockExec.mockImplementation(() => {
      throw new Error('error');
    });
    try {
      await runLambdaCliOperation(mockExec, 'test');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
