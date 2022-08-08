import {
  BadRequestError,
  InputValidationError,
} from '../input-validation.error';

describe('InputValidationError', () => {
  it('should set the custom message', () => {
    const customMessage = 'INVALID_INPUT_MESSAGE';
    const customError = new InputValidationError(customMessage);
    expect(customError.message).toEqual(customMessage);
  });

  it('should set the custom message', () => {
    const customMessage = 'INVALID_INPUT_MESSAGE';
    const customError = new BadRequestError(customMessage);
    expect(customError.message).toEqual(customMessage);
  });
});
