import { LogLevel } from '@nestjs/common';
import { default as pino } from 'pino';
import { LoggerAbstractService } from './logger-abstract.service';

export const logger = pino({});

export class PinoLogger extends LoggerAbstractService {
  constructor(logLevels: LogLevel[]) {
    super(logLevels, {
      log: (message, context?) => logger.info(message, context),
      error: (message, trace, context?) =>
        logger.error(message, trace, context),
      debug: (message, context?) => logger.debug(message, context),
      warn: (message, context?) => logger.warn(message, context),
      verbose: (message, context?) => logger.trace(message, context),
    });
  }
}
