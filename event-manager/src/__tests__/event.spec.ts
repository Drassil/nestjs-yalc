import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals';

import {
  eventLogAsync,
  eventLog,
  eventErrorAsync,
  eventError,
  eventWarnAsync,
  eventWarn,
  eventDebugAsync,
  eventDebug,
  eventVerboseAsync,
  eventVerbose,
  event,
  type IEventOptions,
} from '../index.js';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { createMock } from '@golevelup/ts-jest';
import { DefaultError } from '@nestjs-yalc/errors/default.error.js';
import { type ImprovedNestLogger } from '@nestjs-yalc/logger';

describe('Event Service', () => {
  let eventEmitter;
  let logger;
  let options: IEventOptions;

  beforeEach(() => {
    eventEmitter = createMock<EventEmitter2>(new EventEmitter2());
    logger = createMock<ImprovedNestLogger>();
    options = {
      data: { key: 'value' },
      mask: ['key'],
      trace: 'trace',
      event: {
        emitter: eventEmitter,
        formatter: jest.fn() as any,
      },
      logger: {
        instance: logger,
      },
      error: {
        class: Error,
        systemMessage: 'systemMessage',
        baseOptions: {},
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const message = 'test message';
  const eventName = 'testEvent';

  it('should log event asynchronously', async () => {
    await eventLogAsync(eventName, options);
    expect(logger.log).toHaveBeenCalledWith(eventName, expect.anything());
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log event synchronously', () => {
    eventLog(eventName, options);
    expect(logger.log).toHaveBeenCalledWith(eventName, expect.anything());
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log error event asynchronously', async () => {
    await eventErrorAsync(eventName, options);
    expect(logger.error).toHaveBeenCalledWith(
      eventName,
      'trace',
      expect.anything(),
    );
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log error event synchronously', () => {
    eventError(eventName, options);
    expect(logger.error).toHaveBeenCalledWith(
      eventName,
      'trace',
      expect.anything(),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log error event synchronously without trace', () => {
    eventError(eventName, { ...options, trace: undefined });
    expect(logger.error).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
      expect.anything(),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log warning event asynchronously', async () => {
    await eventWarnAsync(eventName, options);
    expect(logger.warn).toHaveBeenCalledWith(eventName, expect.anything());
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log warning event synchronously', () => {
    eventWarn(eventName, options);
    expect(logger.warn).toHaveBeenCalledWith(eventName, expect.anything());
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log debug event asynchronously', async () => {
    await eventDebugAsync(eventName, options);
    expect(logger.debug).toHaveBeenCalledWith(eventName, expect.anything());
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log debug event synchronously', () => {
    eventDebug(eventName, options);
    expect(logger.debug).toHaveBeenCalledWith(eventName, expect.anything());
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log verbose event asynchronously', async () => {
    await eventVerboseAsync(eventName, options);
    expect(logger.verbose).toHaveBeenCalledWith(eventName, expect.anything());
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log verbose event synchronously', () => {
    eventVerbose(eventName, options);
    expect(logger.verbose).toHaveBeenCalledWith(eventName, expect.anything());
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should handle event without name', async () => {
    const _options: IEventOptions = {
      ...options,
      event: {
        emitter: eventEmitter,
        formatter: jest.fn() as any,
        await: true,
      },
    };
    await eventLog(eventName, _options);
    expect(logger.log).toHaveBeenCalledWith(eventName, expect.anything());
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
    );
  });

  it('should handle event with false', () => {
    const _options: IEventOptions = {
      ...options,
      event: false,
      message,
    };
    eventLog(message, _options);
    expect(logger.log).toHaveBeenCalledWith(message, expect.anything());
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('should handle event with string data', () => {
    eventLog(message, { ...options, data: 'test' });
    expect(logger.log).toHaveBeenCalledWith(
      message,
      expect.objectContaining({
        data: expect.objectContaining({ message: 'test' }),
      }),
    );
  });

  it('should handle logger with false', () => {
    const _options: IEventOptions = {
      ...options,
      logger: false,
      message,
    };
    eventLog(eventName, _options);
    expect(logger.log).not.toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should handle logger with options', () => {
    const _options: IEventOptions = {
      ...options,
      logger: { instance: logger },
      message,
    };
    eventLog(eventName, _options);
    expect(logger.log).toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should handle logger without options', () => {
    eventLog(eventName);
  });

  it('should handle event without options', () => {
    event(eventName);
  });

  it('should handle event with partial options', () => {
    event(eventName, { logger: {} });
  });

  it('should handle error with false', () => {
    const _options = {
      ...options,
      error: false,
      message,
    };
    eventError(eventName, _options);
    expect(logger.error).toHaveBeenCalledWith(
      message,
      'trace',
      expect.anything(),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should handle error with true', () => {
    const _options = {
      ...options,
      error: true,
      message,
    };
    const result = eventError(eventName, _options);
    expect(result).toBeInstanceOf(Error);
  });

  it('should handle error with class', () => {
    class CustomError extends Error {}
    const _options = {
      ...options,
      error: { class: CustomError },
      message,
    };
    const result = eventError(eventName, _options);
    expect(result).toBeInstanceOf(CustomError);
  });

  it('should handle error with true', () => {
    const _options = {
      ...options,
      error: true,
      message,
    };
    const result = event(eventName, _options);
    expect(result).toBeInstanceOf(DefaultError);
  });

  it('should handle error without class', () => {
    const _options: IEventOptions = {
      ...options,
      error: {
        systemMessage: 'test',
      },
      message,
    };
    const result = event(eventName, _options);
    expect(result).toBeInstanceOf(DefaultError);
  });
});
