import { BadRequestException } from '@nestjs/common';

export class InputValidationError extends BadRequestException {
  // There is no default message for this error because in this case
  // who is implementing the validation should be able to give detailed
  // informations for the client on why the input validation failed.
  constructor(message: string, public systemMessage?: string) {
    super(message);
  }
}

export class BadRequestError extends BadRequestException {
  constructor(message: string, public systemMessage?: string) {
    super(message);
  }
}
