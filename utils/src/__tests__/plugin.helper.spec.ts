import { WithPluginSystem, Plugin, PluginMethods } from '../plugin.helper.js';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('WithPluginSystem', () => {
  class TestMethods implements PluginMethods {
    [key: string]: { (...args: any[]): void } | undefined;
    testMethod1?: (...args: any[]) => void;
    testMethod2?: (...args: any[]) => void;
  }

  class TestBase {}

  it('should create a PluginSystemWrapper with default base class', () => {
    const PluginSystemWrapper = WithPluginSystem<TestMethods>();
    expect(new PluginSystemWrapper()).toBeInstanceOf(PluginSystemWrapper);
  });

  it('should create a PluginSystemWrapper with a custom base class', () => {
    const PluginSystemWrapper = WithPluginSystem<TestMethods>(TestBase);
    expect(new PluginSystemWrapper()).toBeInstanceOf(TestBase);
  });

  describe('PluginSystemWrapper', () => {
    let PluginSystemWrapper: any;
    let pluginSystem: any;

    beforeEach(() => {
      PluginSystemWrapper = WithPluginSystem<TestMethods>();
      pluginSystem = new PluginSystemWrapper();
    });

    describe('registerPlugin', () => {
      it('should register a plugin', () => {
        const plugin: Plugin<TestMethods> = { pluginMethods: {} };
        pluginSystem.registerPlugin(plugin);
        expect(pluginSystem.plugins).toContain(plugin);
      });
    });

    describe('unregisterPlugin', () => {
      it('should unregister a plugin', () => {
        const plugin: Plugin<TestMethods> = { pluginMethods: {} };
        pluginSystem.registerPlugin(plugin);
        pluginSystem.unregisterPlugin(plugin);
        expect(pluginSystem.plugins).not.toContain(plugin);
      });
    });

    describe('invokePlugins', () => {
      it('should invoke the correct method on all plugins', () => {
        const plugin1: Plugin<TestMethods> = {
          pluginMethods: {
            testMethod1: jest.fn(),
          },
        };
        const plugin2: Plugin<TestMethods> = {
          pluginMethods: {
            testMethod1: jest.fn(),
          },
        };
        pluginSystem.registerPlugin(plugin1);
        pluginSystem.registerPlugin(plugin2);
        pluginSystem.invokePlugins('testMethod1', 'arg1', 'arg2');

        expect(plugin1.pluginMethods.testMethod1).toHaveBeenCalledWith(
          'arg1',
          'arg2',
        );
        expect(plugin2.pluginMethods.testMethod1).toHaveBeenCalledWith(
          'arg1',
          'arg2',
        );
      });

      it('should not throw if a method is undefined', () => {
        const plugin: Plugin<TestMethods> = { pluginMethods: {} };
        pluginSystem.registerPlugin(plugin);

        expect(() =>
          pluginSystem.invokePlugins('testMethod1', 'arg1'),
        ).not.toThrow();
      });
    });
  });
});
