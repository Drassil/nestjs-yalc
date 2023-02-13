import { ClassType } from '@nestjs-yalc/types';
import { Injectable } from '@nestjs/common';
import { IApiCallStrategy } from './context-call.interface.js';

export interface IApiCallService<Strategy extends IApiCallStrategy> {
  setStrategy(strategy: Strategy): void;
  getStrategy(): Strategy;
}

export function ContextCallServiceFactory<
  Strategy extends IApiCallStrategy,
>(defaultStrategy: Strategy): ClassType<IApiCallService<Strategy>> {
  @Injectable()
  class ContextCallService {
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

  return ContextCallService;
}
