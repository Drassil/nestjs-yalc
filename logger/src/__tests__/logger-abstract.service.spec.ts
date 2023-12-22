import { expect, describe, it } from '@jest/globals';
import { createMock } from '@golevelup/ts-jest';
import { LoggerService } from '@nestjs/common';
import { LoggerAbstractService, beforeLogging } from '../index.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Abstract logger service test', () => {
  class DummyLogger extends LoggerAbstractService {
    constructor(logLevels) {
      super('test', logLevels, createMock<LoggerService>());
    }
  }

  it('Test error', async () => {
    expect(() => new DummyLogger(['dummy'])).toThrowError();
  });
});

describe('beforeLogging', () => {
  const mockedEventEmitter = createMock<EventEmitter2>();

  it('should return when no emitter is specified', () => {
    beforeLogging('test');
  });

  it('should return when no event is specified', () => {
    beforeLogging('test', { eventEmitter: mockedEventEmitter });
  });

  it('should trigger the event', () => {
    beforeLogging('test', { eventEmitter: mockedEventEmitter, event: 'test' });
  });

  it('should trigger the event with fallback name', () => {
    beforeLogging('test', {
      eventEmitter: mockedEventEmitter,
      useFallbackEvent: true,
    });
  });
});
