import { ConsoleLogger } from './logger-console.service';
import { PinoLogger } from './logger-pino.service';
import { Logger as NestLogger, LoggerService, LogLevel } from '@nestjs/common';
import { LoggerTypeEnum, LOG_LEVEL_DEFAULT } from './logger.enum';

export const AppLoggerFactory = (
  context: string,
  loggerLevels: LogLevel[] = LOG_LEVEL_DEFAULT,
  loggerType?: string,
): LoggerService => {
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
      logger = new NestLogger(context, {
        timestamp: true,
      });
      NestLogger.overrideLogger(loggerLevels);
      logger.setLogLevels?.(loggerLevels); // not available on default NEST logger
      break;
  }

  logger.debug?.(`Using ${loggerType} logger`);

  return logger;
};
