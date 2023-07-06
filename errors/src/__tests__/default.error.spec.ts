import { describe, expect, it, jest } from '@jest/globals';
import {
  DefaultError,
  DefaultErrorMixin,
  ON_DEFAULT_ERROR_EVENT,
  newDefaultError,
} from '../default.error.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import EventEmitter from 'events';

describe('DefaultErrorMixin', () => {
  it('should create a class that extends Error when no base class is provided', () => {
    const error = new (DefaultErrorMixin())({}, 'message');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('message');
  });

  it('should create a class that extends the provided base class', () => {
    class CustomError extends Error {}
    const error = new (DefaultErrorMixin(CustomError))({}, 'message');
    expect(error).toBeInstanceOf(CustomError);
    expect(error.message).toBe('message');
  });

  it('should set systemMessage when options is a string', () => {
    const error = new (DefaultErrorMixin())('systemMessage', {});
    expect(error.systemMessage).toBe('systemMessage');
  });

  it('should set data when data option is provided', () => {
    const error = new (DefaultErrorMixin())({ data: 'data' }, 'message');
    expect(error.data).toBe('data'); // Note: You might want to mock `maskDataInObject` to test this
  });

  it('should set systemMessage when systemMessage option is provided', () => {
    const error = new (DefaultErrorMixin())(
      {
        systemMessage: 'systemMessage',
      },
      'message',
    );
    expect(error.systemMessage).toBe('systemMessage');
  });

  it('should log error when logger option is provided', () => {
    const logger = { error: jest.fn() };
    const error = new (DefaultErrorMixin())({ logger }, 'message');
    expect(logger.error).toHaveBeenCalled();
  });

  it('should use console as logger when logger option is true', () => {
    console.error = jest.fn();
    const error = new (DefaultErrorMixin())({ logger: true }, 'message');
    expect(console.error).toHaveBeenCalled();
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
      systemMessage: 'mySystemMessage',
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('message');
    expect(error.systemMessage).toBe('mySystemMessage');
  });

  it('should create an instance of Error with default message when message is not provided', () => {
    const error = new DefaultError();
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('An error occurred');
    expect(error.systemMessage).toBeUndefined();
  });

  it('should create an instance of Error with default options when options are not provided', () => {
    const error = new DefaultError('message');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('message');
    expect(error.systemMessage).toBeUndefined();
    expect(error.data).toBeUndefined();
  });

  it('should create an instance of Error with default base options when base options are not provided', () => {
    const error = new DefaultError('message', {
      systemMessage: 'mySystemMessage',
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('message');
    expect(error.systemMessage).toBe('mySystemMessage');
    // Assuming that the base Error class doesn't use baseOptions
    // Add your tests here depending on the actual implementation of your base Error class and the ErrorOptions type
  });
});
