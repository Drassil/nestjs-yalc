import { ConsoleLogger } from './logger-console.service';
import { PinoLogger } from './logger-pino.service';
import { Logger as NestLogger, LoggerService, LogLevel } from '@nestjs/common';
import { LoggerTypeEnum } from './logger.enum';

export const AppLoggerFactory = (
  loggerLevels: LogLevel[],
  loggerType?: string,
) => {
  let logger: LoggerService;
  switch (loggerType) {
    case LoggerTypeEnum.CONSOLE:
      logger = new ConsoleLogger(loggerLevels);
      break;
    case LoggerTypeEnum.PINO:
      logger = new PinoLogger(loggerLevels);
      break;
    case LoggerTypeEnum.NEST:
    default:
      NestLogger.overrideLogger(loggerLevels);
      logger = new NestLogger();
      break;
  }

  logger.debug?.(`Using ${loggerType} logger`);

  return logger;
};
