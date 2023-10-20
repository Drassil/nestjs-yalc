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
import { BadRequestError, InputValidationError } from '../error.class.js';
import { ErrorsEnum } from '../error.enum.js';

describe('InputValidationError', () => {
  it('should have internal message without the custom message', () => {
    const customError = new InputValidationError();
    expect(customError.internalMessage).toEqual('Invalid value');
  });

  it('should set the custom message', () => {
    const customMessage = 'INVALID_INPUT_MESSAGE';
    const customError = new BadRequestError(customMessage);
    expect(customError.internalMessage).toEqual(
      `${ErrorsEnum.BAD_REQUEST}: ${customMessage}`,
    );
  });
});
