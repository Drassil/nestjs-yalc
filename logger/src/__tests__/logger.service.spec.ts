import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { Test } from '@nestjs/testing';
const { LoggerServiceFactory } = await import('../logger.service.js');
import {
  AppConfigService,
  getAppConfigToken,
} from '@nestjs-yalc/app/app-config.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('LoggerServiceFactory', () => {
  let configService: AppConfigService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: AppConfigService,
          useValue: {
            values: jest.fn().mockReturnValue({
              loggerType: 'console',
              logContextLevels: {
                TestContext: ['debug', 'error'],
              },
              logLevels: ['warn', 'log'],
            }),
          },
        },
      ],
    }).compile();

    configService = moduleRef.get<AppConfigService>(AppConfigService);
  });

  it('should create logger service', () => {
    const loggerService = LoggerServiceFactory(
      'TestContext',
      'TestProvide',
      'TestContext',
    );
    expect(loggerService).toBeDefined();
    expect(loggerService.provide).toBe('TestProvide');
    expect(loggerService.inject).toEqual([
      getAppConfigToken('TestContext'),
      EventEmitter2,
    ]);

    const logger = loggerService.useFactory(configService);
    expect(logger).toBeDefined();
  });

  it('should create logger service with default log levels', () => {
    jest.spyOn(configService, 'values').mockReturnValue({
      loggerType: 'console',
      logLevels: ['warn', 'log'],
    });

    const loggerService = LoggerServiceFactory(
      'TestContext',
      'TestProvide',
      'TestContext',
    );
    const logger = loggerService.useFactory(configService);
    expect(logger).toBeDefined();
  });

  it('should create logger service with event disabled', () => {
    jest.spyOn(configService, 'values').mockReturnValue({
      loggerType: 'console',
      logLevels: ['warn', 'log'],
    });

    const loggerService = LoggerServiceFactory('TestProvide', 'TestContext', {
      event: false,
    });
    const logger = loggerService.useFactory(configService);
    expect(logger).toBeDefined();
  });
});
