import { describe, expect, it, jest } from '@jest/globals';
import {
  DefaultError,
  DefaultErrorMixin,
  ON_DEFAULT_ERROR_EVENT,
  newDefaultError,
  isDefaultErrorMixin,
} from '../default.error.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import EventEmitter from 'events';
import { ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { getHttpStatusDescription } from '@nestjs-yalc/utils/http.helper.js';

describe('DefaultErrorMixin', () => {
  it('should create a class that extends Error when no base class is provided', () => {
    const error = new (DefaultErrorMixin())({}, 'message', 500);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('message');
  });

  it('should create a class that extends the provided base class', () => {
    class CustomError extends HttpException {}
    const error = new (DefaultErrorMixin(CustomError))({}, 'message', 500);
    expect(error).toBeInstanceOf(CustomError);
    expect(error.message).toBe('message');
  });

  it('should set internalMessage when options is a string', () => {
    const error = new (DefaultErrorMixin())(
      { internalMessage: 'internalMessage' },
      {},
      500,
    );
    expect(error.internalMessage).toBe('internalMessage');
  });

  it('should set data when data option is provided', () => {
    const error = new (DefaultErrorMixin())({ data: 'data' }, 'message', 500);
    expect(error.data).toBe('data'); // Note: You might want to mock `maskDataInObject` to test this
  });

  it('should set data when masked data option is provided', () => {
    const error = new (DefaultErrorMixin())(
      { data: { test: 'test' }, masks: ['test'] },
      'message',
      500,
    );
    expect(error.data).toEqual({ test: '[REDACTED]' });
  });

  it('should set internalMessage when internalMessage option is provided', () => {
    const error = new (DefaultErrorMixin())(
      {
        internalMessage: 'internalMessage',
      },
      'message',
      500,
    );
    expect(error.internalMessage).toBe('internalMessage');
  });

  it('should log error when logger option is provided', () => {
    const logger = { error: jest.fn() };
    const error = new (DefaultErrorMixin())(
      { logger: { instance: logger, level: 'error' } },
      'message',
      500,
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it('should use console as logger when logger option is true', () => {
    const logger = { error: jest.fn() };
    const error = new (DefaultErrorMixin())({ logger: {} }, 'message', 500);
    // expect(logger.error).toHaveBeenCalled();
  });

  it('should emit an event when eventEmitter option is provided', () => {
    const eventEmitter = new EventEmitter();
    const eventHandler = jest.fn();
    eventEmitter.on(ON_DEFAULT_ERROR_EVENT, eventHandler);
    const error = new (DefaultErrorMixin())({ eventEmitter }, 'message');
    expect(eventHandler).toHaveBeenCalled();
  });

  it('should emit an event when eventEmitter2 option is provided', () => {
    const eventEmitter = new EventEmitter2();
    const eventHandler = jest.fn();
    eventEmitter.on(ON_DEFAULT_ERROR_EVENT, eventHandler);
    const error = new (DefaultErrorMixin())({ eventEmitter }, 'message', 500);
    expect(eventHandler).toHaveBeenCalled();
  });
});

describe('newDefaultError', () => {
  it('should create a new DefaultError class instance that extends the provided base class', () => {
    class CustomError extends HttpException {}
    const error = newDefaultError(CustomError, {}, 'message', 500);
    expect(error).toBeInstanceOf(CustomError);
    expect(error.message).toBe('message');
  });
});

describe('DefaultError', () => {
  it('should create an instance of Error', () => {
    const error = new DefaultError('my internal message', {
      response: 'my external message',
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('my external message');
    expect(error.internalMessage).toBe('my internal message');
  });

  it('should create an instance of Error with default message when message is not provided', () => {
    const error = new DefaultError();
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Default Error'); // if not specified, the message will be the parsed name of the class
    expect(error.internalMessage).toBeUndefined();
  });

  it('should create an instance of Error with default options when options are not provided', () => {
    const error = new DefaultError('message');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Default Error');
    expect(error.internalMessage).toBe('message');
    expect(error.data).toBeUndefined();
  });

  it('should create an instance of Error with response as a string', () => {
    const error = new DefaultError('message', {
      response: 'my response',
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.getResponse().message).toBe('my response');
    expect(error.getInternalMessage()).toBe('message');
    expect(error.getDescription()).toBe(getHttpStatusDescription(500));
  });

  it('should create an instance of Error with response as an object', () => {
    const error = new DefaultError('message', {
      response: { message: 'ok', test: 'test' },
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.getResponse().message).toBe('ok');
    expect(error.getResponse().test).toBe('test');
  });

  it('should create an instance of Error without options', () => {
    const error = new DefaultError();
    expect(error).toBeInstanceOf(HttpException);
    expect(error.getResponse().message).toBe('Default Error');
  });

  it('should create an instance of the Error with a cause', () => {
    const error = new DefaultError(undefined, {
      cause: new ForbiddenException('test'),
    });

    expect(error.getInternalMessage()).toBe('test');
  });

  it('should create an instance of the Error with options as a string', () => {
    const error = new (DefaultErrorMixin())('external');

    expect(error.getResponse().message).toBe('external');
  });

  describe('isDefaultErrorMixin', () => {
    it('should check if an error is not of DefaultMixin type', () => {
      const check = isDefaultErrorMixin({});
      expect(check).toBeFalsy();
    });

    it('should check if an error is of DefaultMixin type', () => {
      const error = new DefaultError();
      const check = isDefaultErrorMixin(error);
      expect(check).toBeTruthy();
    });
  });
});
