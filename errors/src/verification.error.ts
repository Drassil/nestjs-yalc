import { HttpException, HttpStatus } from '@nestjs/common';
import { DefaultErrorMixin, IDefaultErrorOptions } from './default.error.js';

export class AdditionalVerificationNeededException extends DefaultErrorMixin(
  HttpException,
) {
  constructor(options: IDefaultErrorOptions) {
    super(
      options,
      'Further verification is required for access.',
      HttpStatus.FORBIDDEN,
    );
  }
}
