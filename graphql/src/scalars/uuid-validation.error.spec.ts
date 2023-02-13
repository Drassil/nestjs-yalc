import { UUIDValidationError } from './uuid-validation.error.js';

describe('UUIDValidationError', () => {
  it('should set the custom message', () => {
    const customMessage = 'INVALID_INPUT_MESSAGE';
    const customError = new UUIDValidationError(customMessage);
    expect(customError.message).toEqual(customMessage);
  });
});
