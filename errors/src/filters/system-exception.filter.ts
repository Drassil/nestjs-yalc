import { Catch, LoggerService, ExceptionFilter } from '@nestjs/common';
import { ExceptionContextEnum } from '../errors.enum';
import * as Sentry from '@sentry/node';

@Catch(TypeError, SyntaxError, RangeError, EvalError, ReferenceError)
export class SystemExceptionFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {}

  catch(error: Error) {
    Sentry.captureException(error);
    this.logger.error(error, error.stack, ExceptionContextEnum.SYSTEM);
    return error;
  }
}
