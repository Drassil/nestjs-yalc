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

export declare type AnyFunction<A = any> = (...input: any[]) => A;
export declare type AnyConstructor<A = Record<string, unknown>> = new (
  ...input: any[]
) => A;

export declare type Mixin<T extends AnyFunction> = InstanceType<ReturnType<T>>;
