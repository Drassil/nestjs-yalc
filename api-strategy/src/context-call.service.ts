import { ClassType } from '@nestjs-yalc/types';
import { Injectable } from '@nestjs/common';
import { IApiCallStrategy } from './context-call.interface';

export interface IApiCallService<Strategy extends IApiCallStrategy<any, any>> {
  setStrategy(strategy: Strategy): void;
  getStrategy(): Strategy;
}

export function ContextCallServiceFactory<
  Strategy extends IApiCallStrategy<any, any>,
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
