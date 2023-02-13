import { ConsoleLogger } from './logger-console.service.js';
import { PinoLogger } from './logger-pino.service.js';
import { LoggerService, LogLevel } from '@nestjs/common';
import { LoggerTypeEnum, LOG_LEVEL_DEFAULT } from './logger.enum.js';
import { ImprovedNestLogger } from './logger-nest.service.js';
import { ImprovedLoggerService } from './logger-abstract.service.js';

export const AppLoggerFactory = (
  context: string,
  loggerLevels: LogLevel[] = LOG_LEVEL_DEFAULT,
  loggerType?: string,
): ImprovedLoggerService => {
  let logger: LoggerService;
  switch (loggerType) {
    case LoggerTypeEnum.CONSOLE:
      logger = new ConsoleLogger(context, loggerLevels);
      break;
    case LoggerTypeEnum.PINO:
      logger = new PinoLogger(context, loggerLevels);
      break;
    case LoggerTypeEnum.NEST:
    default:
      logger = new ImprovedNestLogger(context, {
        timestamp: true,
      });
      // not available on default NEST logger
      // ImprovedNestLogger.overrideLogger(loggerLevels);
      logger.setLogLevels?.(loggerLevels);
      break;
  }

  logger.debug?.(`Using ${loggerType} logger`);

  return logger;
};
