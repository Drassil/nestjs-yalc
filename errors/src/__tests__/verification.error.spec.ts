import { HttpException, HttpStatus } from '@nestjs/common';
import { AdditionalVerificationNeededException } from '../verification.error';

describe('Verification error', () => {
  const error = new AdditionalVerificationNeededException();

  it('should be defined', () => {
    expect(error).toBeDefined();
  });

  it('should have the correct message and code', () => {
    expect(error.message).toEqual(
      'Further verification is required for access.',
    );
    expect(error.getStatus()).toEqual(HttpStatus.FORBIDDEN);
  });

  it('should be an instance of HttpException', () => {
    expect(error).toBeInstanceOf(HttpException);
  });
});
