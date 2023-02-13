import { CrudGenError } from '@nestjs-yalc/crud-gen/crud-gen.error.js';
import { UUIDValidationError } from '@nestjs-yalc/graphql/scalars/uuid-validation.error.js';
import { Catch, LoggerService } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { InputValidationError } from '../input-validation.error.js';

@Catch(UUIDValidationError, CrudGenError)
export class ValidationExceptionFilter implements GqlExceptionFilter {
  constructor(private logger: LoggerService) {}

  catch(error: Error) {
    const newError = new InputValidationError(
      error.message,
      (<CrudGenError>error).systemMessage,
    );
    newError.stack = error.stack; // we need the stack trace for dev
    this.logger.error(
      (<CrudGenError>error).systemMessage ?? newError.message,
      newError.stack,
    );

    return newError;
  }
}
