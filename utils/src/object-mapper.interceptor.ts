import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { objectMapper, ObjectMapperType } from './object-mapper.helper.js';

export function objectMapperInterceptor<
  TInputObject extends Record<string, any>,
  TOutputObject extends Record<string, any>,
>(
  mapper: ObjectMapperType<TInputObject, TOutputObject>,
  options: {
    copyNonMappedProperties?: boolean;
    /*
     * Mainly used to select the object to process when the structure
     * of the data contains the object that needs to be mapped in a nested property
     * Can also be used to transform the data before mapping
     */
    transformData?: { (data: any): any };
    callback?: { (inputData: any, outputData: any): any };
  } = {},
) {
  @Injectable()
  class ObjectMapperInterceptor implements NestInterceptor {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(
        map((data) => {
          const _data = options.transformData
            ? options.transformData(data)
            : data;

          if (Array.isArray(_data)) {
            const result = _data.map((item) => objectMapper(item, mapper));
            return options.callback?.(data, result) ?? result;
          }

          const result = objectMapper(_data, mapper, {
            copyNonMappedProperties: options.copyNonMappedProperties,
          });

          return options.callback?.(data, result) ?? result;
        }),
      );
    }
  }

  return ObjectMapperInterceptor;
}
