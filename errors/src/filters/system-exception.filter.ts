import { Catch, ExceptionFilter } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { ExceptionContextEnum } from '../errors.enum';

@Catch(TypeError, SyntaxError, RangeError, EvalError, ReferenceError)
export class SystemExceptionFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {}

  catch(error: Error) {
    this.logger.error(error, error.stack, ExceptionContextEnum.SYSTEM);
    return error;
  }
}
