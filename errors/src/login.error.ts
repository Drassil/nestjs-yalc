import { UnauthorizedException } from '@nestjs/common';
import { ErrorsEnum } from './errors.enum';

export class LoginError extends UnauthorizedException {
  constructor(public systemMessage?: string, message?: string) {
    super(message ?? ErrorsEnum.BAD_LOGIN);
  }
}
