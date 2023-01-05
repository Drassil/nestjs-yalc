import { IEventStrategy } from '../context-event.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClassType } from '@nestjs-yalc/types';

export class NestLocalEventStrategy implements IEventStrategy {
  constructor(private eventEmitter: EventEmitter2) {}

  emit(path: string, payload: any, options?: any): any {
    return this.eventEmitter.emit(path, payload, options);
  }

  emitAsync(path: string, payload: any, options?: any): Promise<any> {
    return this.eventEmitter.emitAsync(path, payload, options);
  }
}

export interface NestLocalCallStrategyProviderOptions {
  NestLocalStrategy?: ClassType<NestLocalEventStrategy>;
}

/**
 * Just a convenient provider to inject the NestLocalCallStrategy
 */
export const NestLocalEventStrategyProvider = (
  provide: string,
  options: NestLocalCallStrategyProviderOptions = {},
) => ({
  provide,
  useFactory: (eventEmitter: EventEmitter2) => {
    const _options = {
      baseUrl: '',
      NestLocalStrategy: NestLocalEventStrategy,
      ...options,
    };

    return new _options.NestLocalStrategy(eventEmitter);
  },
  inject: [EventEmitter2],
});
