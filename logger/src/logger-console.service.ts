/* eslint-disable no-console */
import { LogLevel } from '@nestjs/common';
import { LoggerAbstractService } from './logger-abstract.service';
import { maskDataInObject } from './logger.helper';

export class ConsoleLogger extends LoggerAbstractService {
  constructor(context: string, logLevels: LogLevel[] | undefined) {
    super(context, logLevels, {
      log: (message, methodContext, options, ...rest) =>
        console.log(
          `[${methodContext ?? context}]`,
          message,
          maskDataInObject(options?.data, options?.masks),
          ...rest,
        ),
      error: (message, methodContext, trace, options, ...rest) =>
        console.error(
          `[${methodContext ?? context}]`,
          message,
          trace,
          maskDataInObject(options?.data, options?.masks),
          ...rest,
        ),
      debug: (message, methodContext, options, ...rest) =>
        console.debug(
          `[${methodContext ?? context}]`,
          message,
          maskDataInObject(options?.data, options?.masks),
          ...rest,
        ),
      warn: (message, methodContext, options, ...rest) =>
        console.warn(
          `[${methodContext ?? context}]`,
          message,
          maskDataInObject(options?.data, options?.masks),
          ...rest,
        ),
      verbose: (message, methodContext, options, ...rest) =>
        console.info(
          `[${methodContext ?? context}]`,
          message,
          maskDataInObject(options?.data, options?.masks),
          ...rest,
        ),
    });
  }
}
