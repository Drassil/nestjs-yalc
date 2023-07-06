import { UnauthorizedException } from '@nestjs/common';
import { ErrorsEnum } from './errors.enum.js';
import { DefaultErrorMixin, IDefaultErrorOptions } from './default.error.js';

export class LoginError extends DefaultErrorMixin(UnauthorizedException) {
  constructor(message?: string, options?: IDefaultErrorOptions | string) {
    const systemMessage =
      typeof options === 'string' ? options : options?.systemMessage;
    const _message = message ?? systemMessage ?? ErrorsEnum.BAD_LOGIN;
    super(options ?? _message, _message);
  }
}
