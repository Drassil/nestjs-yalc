import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
const { LoggerServiceFactory } = await import('../logger.service.js');

describe('LoggerServiceFactory', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue({
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

    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  it('should create logger service', () => {
    const loggerService = LoggerServiceFactory(
      'TestConf',
      'TestProvide',
      'TestContext',
    );
    expect(loggerService).toBeDefined();
    expect(loggerService.provide).toBe('TestProvide');
    expect(loggerService.inject).toEqual([ConfigService]);

    const logger = loggerService.useFactory(configService);
    expect(logger).toBeDefined();
  });

  it('should create logger service with default log levels', () => {
    jest.spyOn(configService, 'get').mockReturnValue({
      loggerType: 'console',
      logLevels: ['warn', 'log'],
    });

    const loggerService = LoggerServiceFactory(
      'TestConf',
      'TestProvide',
      'TestContext',
    );
    const logger = loggerService.useFactory(configService);
    expect(logger).toBeDefined();
  });
});
