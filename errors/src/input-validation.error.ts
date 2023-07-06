import { BadRequestException } from '@nestjs/common';
import { DefaultErrorMixin, IDefaultErrorOptions } from './default.error.js';

export class InputValidationError extends DefaultErrorMixin(
  BadRequestException,
) {
  // There is no default message for this error because in this case
  // who is implementing the validation should be able to give detailed
  // informations for the client on why the input validation failed.
  constructor(message: string, options?: string | IDefaultErrorOptions) {
    super(options ?? {}, message);
  }
}

export class BadRequestError extends DefaultErrorMixin(BadRequestException) {
  constructor(message: string, options?: string | IDefaultErrorOptions) {
    super(options ?? {}, message);
  }
}
