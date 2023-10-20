import { expect, describe, it } from '@jest/globals';
import { ErrorsEnum } from '../error.enum.js';
import { LoginError } from '../index.js';

describe('Login error', () => {
  const error = new LoginError();

  it('should be defined', () => {
    expect(error).toBeDefined();
  });

  it('should have the correct message', () => {
    expect(error.getInternalMessage()).toEqual(ErrorsEnum.BAD_LOGIN);
  });

  it('should set the custom message', () => {
    const customMessage = 'Something catastrophic happened!';
    const customError = new LoginError(customMessage);
    expect(customError.getInternalMessage()).toEqual(
      `${ErrorsEnum.BAD_LOGIN}: ${customMessage}`,
    );
  });
});
