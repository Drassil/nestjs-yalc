import { LogLevel } from '@nestjs/common';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test' | 'pipeline';
      NEST_LOGGER_LEVELS?: LogLevel | string;
      TYPEORM_LOGGING?: 'true' | 'false';
    }
    interface Global {
      __JEST_DISABLE_DB: boolean;
      TypeORM_Seeding_Connection: any;
    }
  }
}

export declare type ClassType<Class = any> = { new (...args: any[]): Class };
