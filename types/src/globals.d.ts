/* eslint-disable no-var */
import { LogLevel } from '@nestjs/common';
import { MigrationInterface } from 'typeorm';

declare global {
  var __JEST_DISABLE_DB: boolean;
  var TypeORM_Seeding_Connection: any;
  var TypeORM_Migration_classes:
    | { [connName: string]: MigrationInterface[] | undefined }
    | undefined;

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test' | 'pipeline';
      NEST_LOGGER_LEVELS?: LogLevel | string;
      TYPEORM_LOGGING?: 'true' | 'false';
      /**
       * Allow db connections without a schema
       */
      TYPEORM_NO_SEL_DB?: 'true' | 'false';
    }
  }
}

export declare type ClassType<Class = any> = { new (...args: any[]): Class };

export declare type AnyFunction<A = any, I = any> = (...input: I[]) => A;
export declare type AnyConstructor<A = Record<string, unknown>> = new (
  ...input: any[]
) => A;

export declare type Mixin<T extends AnyFunction> = InstanceType<ReturnType<T>>;

// Names of properties in T with types that include undefined
type OptionalPropertyNames<T> = {
  [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];

// Common properties from L and R with undefined in R[K] replaced by type in L[K]
type SpreadProperties<L, R, K extends keyof L & keyof R> = {
  [P in K]: L[P] | Exclude<R[P], undefined>;
};

type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never; // see note at bottom*

// Type of { ...L, ...R }
type Spread<L, R> = Id<
  // Properties in L that don't exist in R
  Pick<L, Exclude<keyof L, keyof R>> &
    // Properties in R with types that exclude undefined
    Pick<R, Exclude<keyof R, OptionalPropertyNames<R>>> &
    // Properties in R, with types that include undefined, that don't exist in L
    Pick<R, Exclude<OptionalPropertyNames<R>, keyof L>> &
    // Properties in R, with types that include undefined, that exist in L
    SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>
>;

type HTTPMethods =
  | 'DELETE'
  | 'delete'
  | 'GET'
  | 'get'
  | 'HEAD'
  | 'head'
  | 'PATCH'
  | 'patch'
  | 'POST'
  | 'post'
  | 'PUT'
  | 'put'
  | 'OPTIONS'
  | 'options';
