/* eslint-disable no-var */
import { LogLevel } from '@nestjs/common';
import { MigrationInterface } from 'typeorm';

declare global {
  var TypeORM_Seeding_Connection: any;
  var TypeORM_Migration_classes:
    | { [connName: string]: ClassType<MigrationInterface>[] | undefined }
    | undefined;

  namespace NodeJS {
    interface ProcessEnv {
      NEST_LOGGER_LEVELS?: LogLevel | string;
      TYPEORM_LOGGING?: 'true' | 'false';
      /**
       * Allow db connections without a schema
       */
      TYPEORM_NO_SEL_DB?: 'true' | 'false';
    }
  }
}
