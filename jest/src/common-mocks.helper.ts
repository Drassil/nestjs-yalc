/* istanbul ignore file */

jest.mock('@nestjs/graphql');

import * as NestGraphql from '@nestjs/graphql';
import { ExecutionContext } from '@nestjs/common';
import {
  createMock,
  DeepMocked,
  MockOptions,
  PartialFuncReturn,
} from '@golevelup/ts-jest';
import { SelectQueryBuilder } from 'typeorm';

export const mockedNestGraphql = NestGraphql as jest.Mocked<typeof NestGraphql>;
export const mockedGqlCtxCreate =
  (mockedNestGraphql.GqlExecutionContext.create = jest.fn());
export const mockedExecutionContext = createMock<ExecutionContext>();

/**
 * This method can be used to DeepMock a chained object where all methods return
 * its instance
 *
 * @returns DeepMocked object with all methods returning "this" by default
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const mockChainingObject = <T extends object>(
  partial?: PartialFuncReturn<T>,
  options?: MockOptions,
): DeepMocked<T> => {
  const mockObject = createMock<T>(partial, options);

  const propsToOverride = new Map();

  const proxy: DeepMocked<T> = new Proxy(mockObject, {
    get: function (target, prop, receiver) {
      const checkProp = target[<keyof T>prop] as any;

      // do not replace implementation of user defined methods
      if (propsToOverride.has(prop) || (partial && prop in partial)) {
        return Reflect.get(target, prop, receiver);
      }

      return typeof checkProp === 'function'
        ? checkProp.mockImplementation(() => {
            Reflect.get(target, prop, receiver);
            return proxy; // return this proxy instead of the method result
          })
        : Reflect.get(target, prop, receiver);
    },
    set: function (target, property, value, receiver) {
      propsToOverride.set(property, value);
      return Reflect.set(target, property, value, receiver);
    },
  });

  return proxy;
};

/**
 * Similar to mockChainingObject but includes some specific case for
 * the typeorm QueryBuilder
 * @returns DeepMocked querybuilder instance
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const mockQueryBuilder = <T extends object>(
  partial?: PartialFuncReturn<SelectQueryBuilder<T>>,
  options?: MockOptions,
): DeepMocked<SelectQueryBuilder<T>> => {
  const mockObject = mockChainingObject<SelectQueryBuilder<T>>(
    partial,
    options,
  );

  mockObject.connection.createQueryBuilder = jest
    .fn()
    .mockReturnValue(mockObject);

  return mockObject;
};
