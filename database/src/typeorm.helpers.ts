import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PostgresConnectionCredentialsOptions } from 'typeorm/driver/postgres/PostgresConnectionCredentialsOptions.js';
import { TypeORMLogger } from '@nestjs-yalc/logger';
import { ImprovedLoggerService } from '@nestjs-yalc/logger/logger-abstract.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IYalcBaseAppOptions } from '@nestjs-yalc/app/base-app.interface.js';
import { MigrationInterface } from 'typeorm';
import { ClassType } from 'nestjs-yalc';

export const setGlobalMigrationClasses = (
  connName: string,
  classes: ClassType<MigrationInterface>[],
) => {
  global.TypeORM_Migration_classes = {
    ...global.TypeORM_Migration_classes,
    [connName]: classes,
  };
};

export const yalcTypeOrmPostgresOptions = (
  name: string,
  postgresConf: PostgresConnectionCredentialsOptions,
  logger: ImprovedLoggerService,
  eventEmitter: EventEmitter2,
  appOptions?: IYalcBaseAppOptions,
): TypeOrmModuleOptions => {
  return {
    name,
    type: 'postgres',
    logger: new TypeORMLogger(logger, eventEmitter),
    migrations:
      appOptions?.migrations || global.TypeORM_Migration_classes?.[name],
    ...postgresConf,
  };
};
