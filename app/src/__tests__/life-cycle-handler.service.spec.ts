import { describe, expect, it, jest } from '@jest/globals';
import { LifeCycleHandler } from '../life-cycle-handler.service.js';
import { AppContextService } from '../app-context.service.js';
import { createMock } from '@golevelup/ts-jest';

describe('LifeCycleHandler', () => {
  let loggerService: any = { debug: jest.fn() };
  let lifeCycleHandler: LifeCycleHandler;
  let appContextService: AppContextService = createMock<AppContextService>({
    initializedApps: new Set(),
  });

  it('should initialize app', () => {
    lifeCycleHandler = new LifeCycleHandler(
      loggerService,
      'TestApp',
      appContextService,
    );
    expect(loggerService.debug).toHaveBeenCalledWith(
      '====================== Init TestApp ======================',
    );
  });

  it('should not initialize the same app twice', () => {
    expect(
      () => new LifeCycleHandler(loggerService, 'TestApp', appContextService),
    ).toThrow('Cannot initialize the same app (TestApp) twice');
  });

  it('should initialize the same app twice if skipDuplicateAppCheck is true', () => {
    new LifeCycleHandler(loggerService, 'TestApp', appContextService, {
      skipDuplicateAppCheck: true,
    });
    expect(
      () =>
        new LifeCycleHandler(loggerService, 'TestApp', appContextService, {
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
