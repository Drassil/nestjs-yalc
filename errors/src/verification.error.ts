import { HttpException, HttpStatus } from '@nestjs/common';

export class AdditionalVerificationNeededException extends HttpException {
  constructor() {
    super('Further verification is required for access.', HttpStatus.FORBIDDEN);
  }
}
