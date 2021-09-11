/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoggerService, LogLevel } from '@nestjs/common';
import { LogLevelEnum } from './logger.enum';

export type LogMethod = (message: any, context?: string) => void;
export type LogMethodError = (
  message: any,
  trace?: string,
  context?: string,
) => void;

export abstract class LoggerAbstractService implements LoggerService {
  /**
   * This constructor override its empty method based on passed
   * logLevels and methods
   *
   * @param logLevels
   * @param methods
   */
  constructor(logLevels: LogLevel[] | undefined, methods: LoggerService) {
    const enabledLevels: { [key: string]: boolean } = {};
    logLevels?.forEach((level) => {
      if (!(level.toUpperCase() in LogLevelEnum))
        throw new Error(`ERROR: Logger Level: ${level} is not supported!`);

      enabledLevels[level] = true;
    });

    if (enabledLevels[LogLevelEnum.LOG] === true && methods[LogLevelEnum.LOG])
      this.log = methods[LogLevelEnum.LOG];

    if (
      enabledLevels[LogLevelEnum.ERROR] === true &&
      methods[LogLevelEnum.ERROR]
    )
      this.error = methods[LogLevelEnum.ERROR];

    if (enabledLevels[LogLevelEnum.WARN] === true && methods[LogLevelEnum.WARN])
      this.warn = methods[LogLevelEnum.WARN];

    if (
      enabledLevels[LogLevelEnum.DEBUG] === true &&
      methods[LogLevelEnum.DEBUG]
    )
      this.debug = methods[LogLevelEnum.DEBUG];

    if (
      enabledLevels[LogLevelEnum.VERBOSE] === true &&
      methods[LogLevelEnum.VERBOSE]
    )
      this.verbose = methods[LogLevelEnum.VERBOSE];
  }

  log: LogMethod;
  error: LogMethodError;
  warn: LogMethod;
  debug?: LogMethod | undefined;
  verbose?: LogMethod;
}
