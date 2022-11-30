/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoggerService, LogLevel } from '@nestjs/common';
import { LogLevelEnum } from './logger.enum';
export interface LogMethodOptions {
  data?: any;
  masks?: string[];
  context?: string;
}

export type LogMethod = (
  message: any,
  context?: string,
  options?: LogMethodOptions,
) => void;
export type LogMethodError = (
  message: any,
  trace?: string,
  context?: string,
  options?: LogMethodOptions,
) => void;

export interface ImprovedLoggerService extends LoggerService {
  log: LogMethod;
  error: LogMethodError;
  warn: LogMethod;
  debug?: LogMethod | undefined;
  verbose?: LogMethod;
}

export abstract class LoggerAbstractService implements ImprovedLoggerService {
  /**
   * This constructor override its empty method based on passed
   * logLevels and this.methods
   *
   * @param logLevels
   * @param this.methods
   */
  constructor(
    protected context: string,
    protected logLevels: LogLevel[] | undefined,
    protected methods: ImprovedLoggerService,
  ) {
    const enabledLevels: { [key: string]: boolean } = {};
    this.logLevels?.forEach((level) => {
      if (!(level.toUpperCase() in LogLevelEnum))
        throw new Error(`ERROR: Logger Level: ${level} is not supported!`);

      enabledLevels[level] = true;
    });

    if (
      enabledLevels[LogLevelEnum.LOG] === true &&
      this.methods[LogLevelEnum.LOG]
    )
      this.log = this.methods[LogLevelEnum.LOG];

    if (
      enabledLevels[LogLevelEnum.ERROR] === true &&
      this.methods[LogLevelEnum.ERROR]
    )
      this.error = this.methods[LogLevelEnum.ERROR];

    if (
      enabledLevels[LogLevelEnum.WARN] === true &&
      this.methods[LogLevelEnum.WARN]
    )
      this.warn = this.methods[LogLevelEnum.WARN];

    if (
      enabledLevels[LogLevelEnum.DEBUG] === true &&
      this.methods[LogLevelEnum.DEBUG]
    )
      this.debug = this.methods[LogLevelEnum.DEBUG];

    if (
      enabledLevels[LogLevelEnum.VERBOSE] === true &&
      this.methods[LogLevelEnum.VERBOSE]
    )
      this.verbose = this.methods[LogLevelEnum.VERBOSE];
  }

  log: LogMethod;
  error: LogMethodError;
  warn: LogMethod;
  debug?: LogMethod | undefined;
  verbose?: LogMethod;
}
