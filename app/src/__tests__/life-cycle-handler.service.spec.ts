import { describe, expect, it, jest } from '@jest/globals';
import { LifeCycleHandler } from '../life-cycle-handler.service.js';

describe('LifeCycleHandler', () => {
  let loggerService: any = { debug: jest.fn() };
  let lifeCycleHandler: LifeCycleHandler;

  it('should initialize app', () => {
    lifeCycleHandler = new LifeCycleHandler(loggerService, 'TestApp');
    expect(loggerService.debug).toHaveBeenCalledWith(
      '====================== Init TestApp ======================',
    );
  });

  it('should not initialize the same app twice', () => {
    expect(() => new LifeCycleHandler(loggerService, 'TestApp')).toThrow(
      'Cannot initialize the same app (TestApp) twice',
    );
  });

  it('should initialize the same app twice if skipDuplicateAppCheck is true', () => {
    new LifeCycleHandler(loggerService, 'TestApp', {
      skipDuplicateAppCheck: true,
    });
    expect(
      () =>
        new LifeCycleHandler(loggerService, 'TestApp', {
          skipDuplicateAppCheck: true,
        }),
    ).not.toThrow();
  });

  it('should handle module destroy', () => {
    lifeCycleHandler.onModuleDestroy();
    expect(loggerService.debug).toHaveBeenCalledWith(
      '====================== Close TestApp ======================',
    );
  });
});
