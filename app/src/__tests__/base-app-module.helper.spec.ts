import { describe, expect, it } from '@jest/globals';
import {
  YalcBaseAppModule,
  filterSingletonDynamicModules,
  registerSingletonDynamicModule,
  createLifeCycleHandlerProvider,
  envFilePathList,
  baseAppModuleMetadataFactory,
} from '../base-app-module.helper.js';
import { LifeCycleHandler } from '../life-cycle-handler.service.js';
import { APP_LOGGER_SERVICE } from '../def.const.js';
import { NestFactory } from '@nestjs/core';
import { DynamicModule, Module } from '@nestjs/common';
import { IBaseAppOptions } from '../base-app.interface.js';

class DummyDynamicModule extends YalcBaseAppModule {
  static forRoot(options?: IBaseAppOptions): DynamicModule {
    return {
      ...this.dynamicProperties(options),
      ...baseAppModuleMetadataFactory(this, 'appAlias', {
        isSingleton: true,
        ...options,
      }),
    };
  }
}

@Module({
  imports: [
    DummyDynamicModule.forRoot({
      providers: [
        {
          provide: 'test1',
          useValue: 'test',
        },
      ],
    }),
  ],
})
class DummyStaticModule1 {}

@Module({
  imports: [
    DummyDynamicModule.forRoot({
      providers: [
        {
          provide: 'test2',
          useValue: 'test',
        },
      ],
    }),
  ],
})
class DummyStaticModule2 {}

describe('base-app', () => {
  describe('actual Nest module instantiation', () => {
    it('should create dynamic module', async () => {
      const module = await NestFactory.create({
        module: DummyStaticModule1,
        imports: [DummyStaticModule2],
      });

      await module.init();

      const lifeCycleHandler = module.get(LifeCycleHandler);

      expect(module).toBeDefined();
      expect(lifeCycleHandler).toBeDefined();
    });
  });

  describe('YalcBaseAppModule', () => {
    it('should be defined', () => {
      expect(YalcBaseAppModule).toBeDefined();
    });

    it('should create dynamic properties', () => {
      const dynamicProperties = YalcBaseAppModule.dynamicProperties();
      expect(dynamicProperties).toEqual({
        module: YalcBaseAppModule,
        global: true,
        isSingleton: true,
      });
    });

    it('should create dynamic properties with options', () => {
      const dynamicProperties = YalcBaseAppModule.dynamicProperties({
        global: false,
        isSingleton: false,
      });
      expect(dynamicProperties).toEqual({
        module: YalcBaseAppModule,
        global: false,
        isSingleton: false,
      });
    });

    it('should create dynamic properties with options', () => {
      const dynamicProperties = YalcBaseAppModule.dynamicProperties({
        global: false,
        isSingleton: false,
      });
      expect(dynamicProperties).toEqual({
        module: YalcBaseAppModule,
        global: false,
        isSingleton: false,
      });
    });

    it('should create dynamic module for standalone', () => {
      const dynamicModule = YalcBaseAppModule._forRootStandalone('appAlias');
      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.global).toBe(true);
      expect(dynamicModule.isSingleton).toBe(true);
    });

    it('should create dynamic module', () => {
      const dynamicModule = YalcBaseAppModule._forRoot('appAlias');
      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.global).toBe(true);
      expect(dynamicModule.isSingleton).toBe(true);
    });
  });

  describe('filterSingletonDynamicModules', () => {
    class TestModule extends DummyDynamicModule {
      static forRoot(options?: IBaseAppOptions | undefined): DynamicModule {
        return this._forRoot('test', options);
      }
    }

    it('should filter singleton dynamic modules', () => {
      const modules = [
        { ...TestModule.forRoot(), isSingleton: true },
        { ...TestModule.forRoot(), isSingleton: false },
        { ...TestModule.forRoot(), isSingleton: true }, // this should be filtered
        DummyStaticModule1,
      ];
      const result = filterSingletonDynamicModules(modules);
      expect(result).toHaveLength(3);
    });
  });

  describe('registerSingletonDynamicModule', () => {
    class TestModule extends DummyDynamicModule {
      static forRoot(options?: IBaseAppOptions | undefined): DynamicModule {
        return this._forRoot('test', options);
      }
    }

    it('should register singleton dynamic module', () => {
      const result = registerSingletonDynamicModule(
        TestModule,
        TestModule.forRoot(),
      );
      expect(result).toBe(true);
    });

    it('should not register the same singleton dynamic module twice', () => {
      const result = registerSingletonDynamicModule(
        TestModule,
        TestModule.forRoot(),
      );
      expect(result).not.toBe(true);
    });
  });

  describe('createLifeCycleHandlerProvider', () => {
    it('should create life cycle handler provider', () => {
      const provider = createLifeCycleHandlerProvider('appAlias');
      expect(provider).toBeDefined();
      expect(provider.provide).toBe(LifeCycleHandler);
      expect(provider.inject).toEqual([APP_LOGGER_SERVICE]);
    });
  });

  describe('envFilePathList', () => {
    it('should create env file path list', () => {
      const paths = envFilePathList('.');
      expect(paths).toContain('./.env');
      if (process.env.NODE_ENV) {
        expect(paths).toContain(`./.env.${process.env.NODE_ENV}`);
      }
      if (process.env.NODE_ENV !== 'production') {
        expect(paths).toContain('./.env.dist');
      }
    });

    it('should create env file path list for production', () => {
      process.env.NODE_ENV = 'production';
      const paths = envFilePathList('.');
      expect(paths).toContain('./.env');
      expect(paths).toContain(`./.env.production`);
      expect(paths).not.toContain('./.env.dist');
      process.env.NODE_ENV = 'test';
    });
  });

  describe('baseAppModuleMetadataFactory', () => {
    it('should create base app module metadata', () => {
      const metadata = baseAppModuleMetadataFactory('appAlias');
      expect(metadata).toBeDefined();
      expect(metadata.exports).toEqual(
        expect.arrayContaining([APP_LOGGER_SERVICE]),
      );
      expect(metadata.controllers).toEqual([]);
    });

    it('should create base app module metadata with options', () => {
      const metadata = baseAppModuleMetadataFactory('appAlias', {
        isStandalone: true,
        envPath: ['./.env.test'],
        extraConfigs: [],
        providers: [],
        imports: [],
        exports: [],
        controllers: [],
      });
      expect(metadata).toBeDefined();
      expect(metadata.controllers).toEqual([]);
    });

    it('should create base app module metadata with options and controllers', () => {
      const metadata = baseAppModuleMetadataFactory(
        DummyStaticModule1,
        'appAlias',
        {
          isStandalone: false,
          envPath: ['./.env.test'],
          extraConfigs: [],
          providers: [],
          imports: [],
          exports: [],
          controllers: ['TestController'],
        },
      );
      expect(metadata).toBeDefined();
      expect(metadata.controllers).toEqual(['TestController']);
    });
  });
});
