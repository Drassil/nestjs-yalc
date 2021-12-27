import { ConsoleLogger } from "./logger-console.service";
import { PinoLogger } from "./logger-pino.service";
import { Logger as NestLogger, LoggerService, LogLevel } from "@nestjs/common";
import { LoggerTypeEnum } from "./logger.enum";

export const AppLoggerFactory = (
  context: string,
  loggerLevels: LogLevel[],
  loggerType?: string
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
      logger = new NestLogger(context);
      logger.setLogLevels?.(loggerLevels);
      break;
  }

  logger.debug?.(`Using ${loggerType} logger`);

  return logger;
};
