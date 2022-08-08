import { createMock } from '@golevelup/ts-jest';
import { LoggerService, UnprocessableEntityException } from '@nestjs/common';

import { ExceptionContextEnum } from '../errors.enum';
import { SystemExceptionFilter } from '../filters/system-exception.filter';

describe('System exceptions filter', () => {
  let filter: SystemExceptionFilter;
  const loggerServiceMock = createMock<LoggerService>();

  beforeAll(() => {
    filter = new SystemExceptionFilter(loggerServiceMock);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should catch and log UnprocessableEntity error', () => {
    const exception = new UnprocessableEntityException();

    filter.catch(exception);
    expect(loggerServiceMock.error).toBeCalledWith(
      exception,
      exception.stack,
      ExceptionContextEnum.SYSTEM,
    );
  });
});
