import { CrudGenError } from '@nestjs-yalc/crud-gen/crud-gen.error.js';
import { UUIDValidationError } from '@nestjs-yalc/graphql/scalars/uuid-validation.error.js';
import * as common from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { InputValidationError } from '../index.js';

@common.Catch(UUIDValidationError, CrudGenError)
export class ValidationExceptionFilter implements GqlExceptionFilter {
  constructor(private logger: common.LoggerService) {}

  catch(error: Error) {
    const newError = new InputValidationError(
      (<CrudGenError>error).systemMessage,
      { response: { message: error.message } },
    );
    newError.stack = error.stack; // we need the stack trace for dev
    this.logger.error(
      (<CrudGenError>error).systemMessage ?? newError.message,
      newError.stack,
    );

    return newError;
  }
}
