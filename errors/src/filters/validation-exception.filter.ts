import { CrudGenError } from '@nestjs-yalc/crud-gen/crud-gen.error';
import { UUIDValidationError } from '@nestjs-yalc/graphql/scalars/uuid-validation.error';
import { Catch, LoggerService } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { InputValidationError } from '../input-validation.error';
import * as Sentry from '@sentry/node';

@Catch(UUIDValidationError, CrudGenError)
export class ValidationExceptionFilter implements GqlExceptionFilter {
  constructor(private logger: LoggerService) {}

  catch(error: Error) {
    Sentry.captureException(error);
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
