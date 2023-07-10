/* eslint-disable no-console */
import { LogLevel } from '@nestjs/common';
import { LoggerAbstractService } from './logger-abstract.service.js';
import { maskDataInObject } from './logger.helper.js';

export class ConsoleLogger extends LoggerAbstractService {
  constructor(context: string, logLevels: LogLevel[] | undefined) {
    super(context, logLevels, {
      log: (message, options, ...rest) =>
        console.log(
          `[${options?.context ?? context}]`,
          message,
          maskDataInObject(options?.data, options?.masks, options?.trace),
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
          maskDataInObject(options?.data, options?.masks, options?.trace),
          ...rest,
        ),
      warn: (message, options, ...rest) =>
        console.warn(
          `[${options?.context ?? context}]`,
          message,
          maskDataInObject(options?.data, options?.masks, options?.trace),
          ...rest,
        ),
      verbose: (message, options, ...rest) =>
        console.info(
          `[${options?.context ?? context}]`,
          message,
          maskDataInObject(options?.data, options?.masks, options?.trace),
          ...rest,
        ),
    });
  }
}
