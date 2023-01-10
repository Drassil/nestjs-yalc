import { createMock } from '@golevelup/ts-jest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NestLocalEventStrategy,
  NestLocalEventStrategyProvider,
} from './nest-local-event.strategy';

describe('NestLocalEventStrategy', () => {
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = createMock<EventEmitter2>();
  });

  it('should be defined', () => {
    expect(NestLocalEventStrategy).toBeDefined();
  });

  it('should be instantiable', () => {
    const instance = new NestLocalEventStrategy(eventEmitter);
    expect(instance).toBeDefined();
  });

  it('should call method emit', () => {
    const instance = new NestLocalEventStrategy(eventEmitter);
    instance.emit('test', {});
    expect(eventEmitter.emit).toHaveBeenCalled();
  });

  it('should call method emit Async', () => {
    const instance = new NestLocalEventStrategy(eventEmitter);
    instance.emitAsync('test', {});
    expect(eventEmitter.emitAsync).toHaveBeenCalled();
  });

  it('should create a provider', () => {
    const provider = NestLocalEventStrategyProvider('test');
    expect(provider).toBeDefined();
  });

  it('should create a provider and execute the useFactory method', () => {
    const provider = NestLocalEventStrategyProvider('test');
    expect(provider.useFactory(eventEmitter)).toBeDefined();
  });
});
