import { createMock } from '@golevelup/ts-jest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContextEventServiceFactory } from './context-event.service.js';
import { NestLocalEventStrategy } from './index.js';

describe('ContextEventServiceFactory', () => {
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = createMock<EventEmitter2>();
  });

  it('should be defined', () => {
    expect(ContextEventServiceFactory).toBeDefined();
  });

  it('should return a class', () => {
    const ContextCallService = ContextEventServiceFactory(
      new NestLocalEventStrategy(eventEmitter),
    );
    expect(ContextCallService).toBeDefined();
  });

  it('should return a class that can be instantiated', () => {
    const ContextCallService = ContextEventServiceFactory(
      new NestLocalEventStrategy(eventEmitter),
    );
    const instance = new ContextCallService();
    expect(instance).toBeDefined();
  });

  it('should return a class that can set and get a strategy', () => {
    const ContextCallService = ContextEventServiceFactory(
      new NestLocalEventStrategy(eventEmitter),
    );
    const instance = new ContextCallService();
    const strategy = new NestLocalEventStrategy(eventEmitter);
    instance.setStrategy(strategy);
    expect(instance.getStrategy()).toBe(strategy);
  });
});
