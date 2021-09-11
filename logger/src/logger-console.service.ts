/* eslint-disable no-console */
import { LogLevel } from '@nestjs/common';
import { LoggerAbstractService } from './logger-abstract.service';

export class ConsoleLogger extends LoggerAbstractService {
  constructor(logLevels: LogLevel[] | undefined) {
    super(logLevels, {
      log: (message) => console.log(message),
      error: (message, trace) => console.error(message, trace),
      debug: (message) => console.debug(message),
      warn: (message) => console.warn(message),
      verbose: (message) => console.info(message),
    });
  }
}
