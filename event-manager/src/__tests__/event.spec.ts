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
  eventException,
  eventWarnAsync,
  eventWarn,
  eventDebugAsync,
  eventDebug,
  eventVerboseAsync,
  eventVerbose,
  IEventOptions,
} from '../event.js'; // replace with your actual module path
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ImprovedNestLogger } from '@nestjs-yalc/logger/logger-nest.service.js';
import { createMock } from '@golevelup/ts-jest';

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
        name: eventName,
      },
      logger: {
        instance: logger,
        level: 'log',
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
    await eventLogAsync(message, eventName, options);
    expect(logger.log).toHaveBeenCalledWith(message, expect.anything());
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log event synchronously', () => {
    eventLog(message, eventName, options);
    expect(logger.log).toHaveBeenCalledWith(message, expect.anything());
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log error event asynchronously', async () => {
    await eventErrorAsync(message, eventName, options);
    expect(logger.error).toHaveBeenCalledWith(
      message,
      'trace',
      expect.anything(),
    );
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log error event synchronously', () => {
    eventError(message, eventName, options);
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

  it('should throw exception', () => {
    expect(eventException(message, eventName, options)).toBeInstanceOf(Error);
  });

  it('should log warning event asynchronously', async () => {
    await eventWarnAsync(message, eventName, options);
    expect(logger.warn).toHaveBeenCalledWith(message, expect.anything());
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log warning event synchronously', () => {
    eventWarn(message, eventName, options);
    expect(logger.warn).toHaveBeenCalledWith(message, expect.anything());
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log debug event asynchronously', async () => {
    await eventDebugAsync(message, eventName, options);
    expect(logger.debug).toHaveBeenCalledWith(message, expect.anything());
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log debug event synchronously', () => {
    eventDebug(message, eventName, options);
    expect(logger.debug).toHaveBeenCalledWith(message, expect.anything());
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log verbose event asynchronously', async () => {
    await eventVerboseAsync(message, eventName, options);
    expect(logger.verbose).toHaveBeenCalledWith(message, expect.anything());
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should log verbose event synchronously', () => {
    eventVerbose(message, eventName, options);
    expect(logger.verbose).toHaveBeenCalledWith(message, expect.anything());
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should handle event without name', async () => {
    const _options: IEventOptions = {
      ...options,
      event: {
        name: 'test',
        emitter: eventEmitter,
        formatter: jest.fn() as any,
        await: true,
      },
    };
    await eventLog(message, _options);
    expect(logger.log).toHaveBeenCalledWith(message, expect.anything());
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
    );
  });

  it('should handle event with false', () => {
    const _options = {
      ...options,
      event: false,
    };
    eventLog(message, _options);
    expect(logger.log).toHaveBeenCalledWith(message, expect.anything());
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('should handle logger with false', () => {
    const _options = {
      ...options,
      logger: false,
    };
    eventLog(message, _options);
    expect(logger.log).not.toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      eventName,
      expect.anything(),
    );
  });

  it('should handle error with false', () => {
    const _options = {
      ...options,
      error: false,
    };
    eventError(message, eventName, _options);
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
    };
    const result = eventException(message, eventName, _options);
    expect(result).toBeInstanceOf(Error);
  });

  it('should handle error with class', () => {
    class CustomError extends Error {}
    const _options = {
      ...options,
      error: { class: CustomError },
    };
    const result = eventException(message, eventName, _options);
    expect(result).toBeInstanceOf(CustomError);
  });
});
