import { ConfigService } from '@nestjs/config';
import { AppLoggerFactory } from '@nestjs-yalc/logger';
import { LogLevel } from '@nestjs/common';
import type { ImprovedLoggerService } from '@nestjs-yalc/logger/logger-abstract.service.js';
import { IServiceConf } from '@nestjs-yalc/app/conf.type.js';

export const LoggerServiceFactory = (
  confAlias: string,
  provide: string,
  context: string,
) => ({
  provide: provide,
  useFactory: (config: ConfigService): ImprovedLoggerService => {
    const conf = config.get<IServiceConf>(confAlias);
    const loggerType = conf?.loggerType;
    const loggerLevels: LogLevel[] =
      conf?.logContextLevels?.[context] || conf?.logLevels || [];
    return AppLoggerFactory(context, loggerLevels, loggerType);
  },
  inject: [ConfigService],
});
