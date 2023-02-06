import { createMock } from '@golevelup/ts-jest';
import { LoggerService } from '@nestjs/common';
import { ValidationExceptionFilter } from '../filters/validation-exception.filter.js';
import { InputValidationError } from '../input-validation.error.js';
import { CrudGenError } from '@nestjs-yalc/crud-gen/crud-gen.error.js';

describe('ValidationExceptionFilter', () => {
  const logger = createMock<LoggerService>();
  it('should received error to InputValidationError', () => {
    const filter = new ValidationExceptionFilter(logger);
    const result = filter.catch(new Error());
    expect(result).toBeInstanceOf(InputValidationError);
  });

  it('should received error to CrudGenError', () => {
    const error: CrudGenError = new CrudGenError('message', 'systemMessage');
    const filter = new ValidationExceptionFilter(logger);
    filter.catch(error);
    expect(logger.error).toHaveBeenCalledWith(error.systemMessage, error.stack);
  });
});
