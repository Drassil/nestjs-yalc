import { UnauthorizedException } from '@nestjs/common';
import { ErrorsEnum } from './errors.enum.js';
import { DefaultErrorMixin, IDefaultErrorOptions } from './default.error.js';

export class UnauthorizedError extends DefaultErrorMixin(
  UnauthorizedException,
) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      options ?? {},
      message
        ? `${ErrorsEnum.UNAUTHORIZED}: ${message}`
        : ErrorsEnum.UNAUTHORIZED,
    );
  }
}
