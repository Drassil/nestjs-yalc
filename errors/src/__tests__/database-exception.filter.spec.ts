import { createMock } from '@golevelup/ts-jest';
import {
  ArgumentsHost,
  InternalServerErrorException,
  LoggerService,
} from '@nestjs/common';
import { EntityTarget } from 'typeorm';
import { ConnectionNotFoundError, EntityNotFoundError } from 'typeorm';
import { ExceptionContextEnum } from '../errors.enum';
import { DatabaseExceptionFilter } from '../filters/database-exception.filter';

describe('Database exceptions filter', () => {
  let filter: DatabaseExceptionFilter;
  const loggerServiceMock = createMock<LoggerService>();

  beforeEach(() => {
    filter = new DatabaseExceptionFilter(loggerServiceMock);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should catch and log EntityNotFound errors', () => {
    const mockArgumentsHost = createMock<ArgumentsHost>();

    const mockedEntityTarget: EntityTarget<null> = 'emptyString';
    const error = new EntityNotFoundError(mockedEntityTarget, []);

    const returnedError = filter.catch(error, mockArgumentsHost);
    expect(loggerServiceMock.error).toBeCalledWith(
      error,
      ExceptionContextEnum.DATABASE,
    );
    expect(returnedError).toBeInstanceOf(InternalServerErrorException);
  });

  it('should catch and log ConnectionNotFoundError errors', () => {
    const mockArgumentsHost = createMock<ArgumentsHost>();

    const error = new ConnectionNotFoundError('test connection');

    filter.catch(error, mockArgumentsHost);
    expect(loggerServiceMock.error).toBeCalledWith(
      error,
      error.stack,
      ExceptionContextEnum.DATABASE,
    );
  });
});
