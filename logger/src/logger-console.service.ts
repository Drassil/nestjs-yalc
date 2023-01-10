/* eslint-disable no-console */
import { LogLevel } from '@nestjs/common';
import { LoggerAbstractService } from './logger-abstract.service';
import { maskDataInObject } from './logger.helper';

export class ConsoleLogger extends LoggerAbstractService {
  constructor(context: string, logLevels: LogLevel[] | undefined) {
    super(context, logLevels, {
      log: (message, options, ...rest) =>
        console.log(
          `[${options?.context ?? context}]`,
          message,
          maskDataInObject(options?.data, options?.masks),
          ...rest,
        ),
      error: (message, trace, options, ...rest) =>
        console.error(
          `[${options?.context ?? context}]`,
          message,
          trace,
          maskDataInObject(options?.data, options?.masks),
          ...rest,
        ),
      debug: (message, options, ...rest) =>
        console.debug(
          `[${options?.context ?? context}]`,
          message,
          maskDataInObject(options?.data, options?.masks),
          ...rest,
        ),
      warn: (message, options, ...rest) =>
        console.warn(
          `[${options?.context ?? context}]`,
          message,
          maskDataInObject(options?.data, options?.masks),
          ...rest,
        ),
      verbose: (message, options, ...rest) =>
        console.info(
          `[${options?.context ?? context}]`,
          message,
          maskDataInObject(options?.data, options?.masks),
          ...rest,
        ),
    });
  }
}
