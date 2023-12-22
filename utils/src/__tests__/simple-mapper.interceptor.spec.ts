import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ExecutionContext, CallHandler, NestInterceptor } from '@nestjs/common';
import { of } from 'rxjs';
import { buildSimpleMapperInterceptor } from '../simple-mapper.interceptor.js';

describe('SimpleMapperInterceptor', () => {
  let interceptor: NestInterceptor;

  class TestDto {
    prop1: string;
    prop2: number;

    constructor(data: { prop1: string; prop2: number }) {
      this.prop1 = data.prop1;
      this.prop2 = data.prop2;
    }
  }

  const rawTestObject = { prop1: 'test', prop2: 123 };

  beforeEach(() => {
    interceptor = new (buildSimpleMapperInterceptor(TestDto))();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should map raw data to DTO', (done) => {
    const executionContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn(),
    } as unknown as ExecutionContext;

    const next: CallHandler = {
      handle: () => of(rawTestObject),
    };

    interceptor.intercept(executionContext, next).subscribe((result) => {
      expect(result).toBeInstanceOf(TestDto);
      expect(result).toMatchObject(rawTestObject);
      done();
    });
  });
});
