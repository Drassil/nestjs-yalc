import { MissingArgumentsError } from '../missing-arguments.error';
import { CrudGenErrors } from '../strings.enum';

describe('Missing arguments error', () => {
  const error = new MissingArgumentsError();

  it('should be defined', () => {
    expect(error).toBeDefined();
  });

  it('should have the correct message', () => {
    expect(error.message).toEqual(CrudGenErrors.REQUIRED_ARGS);
  });

  it('should set the custom message', () => {
    const customMessage = 'Something catastrophic happened!';
    const customError = new MissingArgumentsError(customMessage);
    expect(customError.message).toEqual(customMessage);
  });
});
