import { describe, expect, it, jest } from '@jest/globals';
import {
  DefaultError,
  DefaultErrorMixin,
  ON_DEFAULT_ERROR_EVENT,
  newDefaultError,
} from '../default.error.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import EventEmitter from 'events';
import { HttpException } from '@nestjs/common';

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
    expect(logger.error).toHaveBeenCalled();
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
    const error = new (DefaultErrorMixin())({ eventEmitter }, 'message');
    expect(eventHandler).toHaveBeenCalled();
  });
});

describe('newDefaultError', () => {
  it('should create a new DefaultError class instance that extends the provided base class', () => {
    class CustomError extends Error {}
    const error = newDefaultError(CustomError, {}, 'message');
    expect(error).toBeInstanceOf(CustomError);
    expect(error.message).toBe('message');
  });
});

describe('DefaultError', () => {
  it('should create an instance of Error', () => {
    const error = new DefaultError('message', {
      internalMessage: 'myinternalMessage',
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('message');
    expect(error.internalMessage).toBe('myinternalMessage');
  });

  it('should create an instance of Error with default message when message is not provided', () => {
    const error = new DefaultError();
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('An error occurred');
    expect(error.internalMessage).toBeUndefined();
  });

  it('should create an instance of Error with default options when options are not provided', () => {
    const error = new DefaultError('message');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('message');
    expect(error.internalMessage).toBeUndefined();
    expect(error.data).toBeUndefined();
  });

  it('should create an instance of Error with default base options when base options are not provided', () => {
    const error = new DefaultError('message', {
      internalMessage: 'myinternalMessage',
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('message');
    expect(error.internalMessage).toBe('myinternalMessage');
    // Assuming that the base Error class doesn't use baseOptions
    // Add your tests here depending on the actual implementation of your base Error class and the ErrorOptions type
  });
});
