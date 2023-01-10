import { ClassType } from '@nestjs-yalc/types';
import { Injectable } from '@nestjs/common';
import { IEventStrategy } from './context-event.interface';

export interface IApiMessageService<Strategy extends IEventStrategy> {
  setStrategy(strategy: Strategy): void;
  getStrategy(): Strategy;
}

export function ContextEventServiceFactory<Strategy extends IEventStrategy>(
  defaultStrategy: Strategy,
): ClassType<IApiMessageService<Strategy>> {
  @Injectable()
  class ContextEventService {
    /**
     *
     * @param strategy - by default, it will use the strategy provided in the factory
     */
    constructor(protected strategy: Strategy = defaultStrategy) {}

    setStrategy(strategy: Strategy) {
      this.strategy = strategy;
    }

    getStrategy() {
      return this.strategy;
    }
  }

  return ContextEventService;
}
