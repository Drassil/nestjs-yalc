import { describe, expect, it } from '@jest/globals';

import { CallHandler, ExecutionContext } from '@nestjs/common';
import { objectMapperInterceptor } from '../object-mapper.interceptor.js';
import { ObjectMapperType } from '../object-mapper.helper.js';
import { of } from 'rxjs';
import { createMock } from '@golevelup/ts-jest';

describe('objectMapperInterceptor', () => {
  const input = {
    a: 'A',
    b: 'B',
  };

  const mapper: ObjectMapperType<typeof input, { x: string; y: string }> = {
    a: 'x',
    b: 'y',
  };

  const mockExecutionContext = createMock<ExecutionContext>();

  const mockCallHandler: CallHandler = {
    handle: () => of(input),
  };

  it('should map properties with the specified mapper', (done) => {
    const interceptor = objectMapperInterceptor(mapper);
    const instance = new interceptor();
    instance
      .intercept(mockExecutionContext, mockCallHandler)
      .subscribe((result) => {
        expect(result).toEqual({
          x: 'A',
          y: 'B',
        });
        done();
      });
  });

  it('should handle array data and map each item', (done) => {
    const interceptor = objectMapperInterceptor(mapper);
    const instance = new interceptor();

    const arrayData = [input, input];
    const mockCallHandlerWithArray: CallHandler = {
      handle: () => of(arrayData),
    };

    instance
      .intercept(mockExecutionContext, mockCallHandlerWithArray)
      .subscribe((result) => {
        expect(result).toEqual([
          {
            x: 'A',
            y: 'B',
          },
          {
            x: 'A',
            y: 'B',
          },
        ]);
        done();
      });
  });

  it('should use transformData if provided', (done) => {
    const interceptor = objectMapperInterceptor(mapper, {
      transformData: (data: any) => {
        return { ...data, a: data.a.toLowerCase() };
      },
    });

    const instance = new interceptor();
    instance
      .intercept(mockExecutionContext, mockCallHandler)
      .subscribe((result) => {
        expect(result).toEqual({
          x: 'a',
          y: 'B',
        });
        done();
      });
  });

  it('should use callback if provided', (done) => {
    const interceptor = objectMapperInterceptor(mapper, {
      callback: (inputData: any, outputData: any) => {
        return { ...outputData, z: inputData.a + inputData.b };
      },
    });

    const instance = new interceptor();
    instance
      .intercept(mockExecutionContext, mockCallHandler)
      .subscribe((result) => {
        expect(result).toEqual({
          x: 'A',
          y: 'B',
          z: 'AB',
        });
        done();
      });
  });
});
