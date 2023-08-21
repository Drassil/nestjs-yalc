import { AppLoggerFactory } from '@nestjs-yalc/logger';
import { LogLevel } from '@nestjs/common';
import type { ImprovedLoggerService } from '@nestjs-yalc/logger/logger-abstract.service.js';
import { IServiceConf } from '@nestjs-yalc/app/conf.type.js';
import { AppConfigService } from '@nestjs-yalc/app/app-config.service.js';

export const LoggerServiceFactory = (provide: string, context: string) => ({
  provide: provide,
  useFactory: (
    config: AppConfigService<IServiceConf>,
  ): ImprovedLoggerService => {
    const conf = config.values;
    const loggerType = conf.loggerType;
    const loggerLevels: LogLevel[] =
      conf.logContextLevels?.[context] || conf.logLevels || [];
    return AppLoggerFactory(context, loggerLevels, loggerType);
  },
  inject: [AppConfigService],
});
