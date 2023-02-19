import {
  describe,
  expect,
  it,
  jest,
  beforeAll,
  beforeEach,
  test,
} from '@jest/globals';

import { commandWithErrors } from '../command.helper.js';

describe('test shared functions', () => {
  it('should run cliWithErrors without errors', async () => {
    const fn = jest.fn();
    const cliWithErrorsResult = commandWithErrors(fn);
    await cliWithErrorsResult(1);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(1);
  });

  it('should run cliWithErrors and call the process exit', async () => {
    const spiedProcessExit = jest.spyOn(process, 'exit');

    spiedProcessExit.mockImplementation((() => {}) as any);

    await commandWithErrors(async () => {
      throw new Error('Test');
    })('Test');
    expect(spiedProcessExit).toHaveBeenCalledWith(1);

    spiedProcessExit.mockRestore();
  });
});
