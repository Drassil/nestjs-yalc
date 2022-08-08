import { ErrorsEnum } from '../errors.enum';
import { UnauthorizedError } from '../unauthorized.error';

describe('Unauthorized error', () => {
  const error = new UnauthorizedError();

  it('should be defined', () => {
    expect(error).toBeDefined();
  });

  it('should have the correct message', () => {
    expect(error.message).toEqual(ErrorsEnum.UNAUTHORIZED);
  });

  it('should set the custom message', () => {
    const customMessage = 'Something catastrophic happened!';
    const customError = new UnauthorizedError(customMessage);
    expect(customError.message).toEqual(
      `${ErrorsEnum.UNAUTHORIZED}: ${customMessage}`,
    );
  });
});
