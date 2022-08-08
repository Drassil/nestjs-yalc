import type { LogLevel } from '@nestjs/common';
import type { LoggerTypeEnum } from '@nestjs-yalc/logger/logger.enum';
import type { IKafkaConfig } from '@nestjs-yalc/kafka';

interface IServiceConfBase {
  appName: string;
  apiPrefix: string;
  loggerType: LoggerTypeEnum | string;
  logLevels: LogLevel[];
  /** You can specialize log levels per each logger context. By default logLevels is used instead */
  logContextLevels?: { [key: string]: LogLevel[] };
  domain: string;

  host: string;
  port: number;
  isDev: boolean;
  isTest: boolean;
  isPipeline: boolean;
  isProduction: boolean;
  playground?: boolean;
  env: typeof process.env.NODE_ENV;
}

export interface IServiceConf extends IServiceConfBase {
  jwtSecretPrivate: string;
  jwtSecretPublic: string;
  jwtSecretMobile: string;
  apiPrefix: string;
  basePath: string;
  operationPrefix: string;
}

export interface IServiceConfKafka extends IServiceConfBase {
  kafkaConfig: IKafkaConfig;
}
