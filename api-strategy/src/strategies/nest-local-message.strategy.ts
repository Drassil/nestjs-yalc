import { IEventStrategy } from '../context-event.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';

export class NestLocalEventStrategy implements IEventStrategy {
  constructor(private eventEmitter: EventEmitter2) {}

  emit(path: string, payload: any, options?: any): any {
    return this.eventEmitter.emit(path, payload, options);
  }

  emitAsync(path: string, payload: any, options?: any): Promise<any> {
    return this.eventEmitter.emitAsync(path, payload, options);
  }
}

/**
 * Just a convenient provider to inject the NestLocalEventStrategy
 */
export const NestLocalEventStrategyProvider = (provide: string) => ({
  provide,
  useFactory: (eventEmitter: EventEmitter2) => {
    return new NestLocalEventStrategy(eventEmitter);
  },
  inject: [EventEmitter2],
});
