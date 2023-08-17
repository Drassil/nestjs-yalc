import { ClassType } from '@nestjs-yalc/types/globals.d.js';
import { DynamicModule, ModuleMetadata } from '@nestjs/common';
import {
  ConfigFactory,
  ConfigObject,
  ConfigFactoryKeyHost,
} from '@nestjs/config';

export interface ISingletonOption {
  /**
   * This is used to make sure that the module is not instantiated multiple times
   * This is useful when you have a dynamic module that is imported in multiple other modules
   * If you use static modules, this is not needed
   * NOTE: should be used in conjunction with the `global` property
   */
  isSingleton?: boolean;
}

export interface ISingletonDynamicModule
  extends ISingletonOption,
    DynamicModule {}

export interface IYalcBaseAppOptions extends Partial<ISingletonDynamicModule> {
  configFactory?: ConfigFactory<ConfigObject>;
  extraConfigs?: (ConfigFactory<ConfigObject> &
    ConfigFactoryKeyHost<ReturnType<ConfigFactory<ConfigObject>>>)[];
  envPath?: string | string[];
  /**
   * When envPath is not defined, this will be used to find the env file
   */
  envDir?: string;
  migrations?: ClassType[];
  skipDuplicateAppCheck?: boolean;
  skipGlobalInterceptors?: boolean;
  /**
   * used internally, probably you don't wan to set thi
   */
  skipDefaultApp?: boolean;
  isStandalone?: boolean;
  /**
   * used to define when a module is used as an application or loaded within an application
   */
  isApp?: boolean;
  logger?: boolean;
}

export type BaseAppStaticOptions = Omit<IYalcBaseAppOptions, 'module'>;

export interface IYalcBaseDynamicModule extends ISingletonDynamicModule {
  imports: NonNullable<DynamicModule['imports']>;
  exports: NonNullable<DynamicModule['exports']>;
  controllers: NonNullable<DynamicModule['controllers']>;
  providers: NonNullable<DynamicModule['providers']>;
}

export interface IYalcBaseStaticModule extends ModuleMetadata {
  imports: NonNullable<DynamicModule['imports']>;
  exports: NonNullable<DynamicModule['exports']>;
  controllers: NonNullable<DynamicModule['controllers']>;
  providers: NonNullable<DynamicModule['providers']>;
}
