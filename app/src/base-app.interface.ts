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
   */
  isSingleton?: boolean;
}

export interface ISingletonDynamicModule
  extends ISingletonOption,
    DynamicModule {}

export interface IBaseAppOptions extends Partial<ISingletonDynamicModule> {
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
  isStandalone?: boolean;
}

export type BaseAppStaticOptions = Omit<IBaseAppOptions, 'module'>;

export interface IBaseDynamicModule extends ISingletonDynamicModule {
  /**
   * @deprecated you can import the ConfigService everywhere now
   */
  configModule?: DynamicModule;
  imports: NonNullable<DynamicModule['imports']>;
  exports: NonNullable<DynamicModule['exports']>;
  controllers: NonNullable<DynamicModule['controllers']>;
  providers: NonNullable<DynamicModule['providers']>;
}

export interface IBaseStaticModule extends ModuleMetadata {
  imports: NonNullable<DynamicModule['imports']>;
  exports: NonNullable<DynamicModule['exports']>;
  controllers: NonNullable<DynamicModule['controllers']>;
  providers: NonNullable<DynamicModule['providers']>;
}
