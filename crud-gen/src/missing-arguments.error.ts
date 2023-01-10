import { BadRequestException } from '@nestjs/common';
import { CrudGenErrors } from './strings.enum';

export class ArgumentsError extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export class MissingArgumentsError extends ArgumentsError {
  constructor(message?: string) {
    super(message ?? CrudGenErrors.REQUIRED_ARGS);
  }
}
