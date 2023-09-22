import { LogLevelEnum } from '@nestjs-yalc/logger/logger.enum.js';
import { HttpStatus } from '@nestjs/common';
import { LogLevel } from 'typeorm';

export function getLogLevelByStatus(statusCode: number) {
  let loggerLevel: LogLevel;
  switch (true) {
    case statusCode >= HttpStatus.INTERNAL_SERVER_ERROR:
      loggerLevel = LogLevelEnum.ERROR;
      break;
    case statusCode === HttpStatus.TOO_MANY_REQUESTS:
      loggerLevel = LogLevelEnum.WARN;
      break;
    case statusCode >= HttpStatus.BAD_REQUEST:
    default:
      loggerLevel = LogLevelEnum.LOG;
      break;
  }

  return loggerLevel;
}
