import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { IFieldMapper } from '@nestjs-yalc/interfaces/maps.interface.js';
import { CGQueryDto } from './crud-gen-rest.dto.js';
import { objectMapperInterceptor } from '@nestjs-yalc/utils/object-mapper.interceptor.js';
import { ObjectMapperType } from '@nestjs-yalc/utils/object-mapper.helper.js';

export function crudGenRestPaginationInterceptorWorker<T>(
  startRow?: number,
  endRow?: number,
) {
  return ([page, count]: [T, number]) => {
    return {
      nodes: page,
      pageData: { count, startRow: startRow ?? 0, endRow: endRow ?? count },
    };
  };
}

@Injectable()
export class CrudGenRestPaginationInterceptor<T = IFieldMapper>
  implements NestInterceptor<T>
{
  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const request = http.getRequest();

    const params: CGQueryDto = request.query ?? {};

    const { startRow, endRow } = params;

    return next
      .handle()
      .pipe(map(crudGenRestPaginationInterceptorWorker(startRow, endRow)));
  }
}

export function buildCrudGenRestMapperInterceptor<
  TInputObject extends Record<string, any> = any,
  TOutputObject extends Record<string, any> = any,
>(
  entityToDtoSchema: ObjectMapperType<TInputObject, TOutputObject>,
  withPagination: boolean = false,
) {
  return objectMapperInterceptor<TInputObject, TOutputObject>(
    entityToDtoSchema,
    {
      transformData: (data) => {
        return withPagination ? data[0] : data; // with pagination, data is [data, count]
      },
      callback: (inputData, data) => {
        return withPagination ? [data, inputData[1]] : data; // [data, count] or data
      },
    },
  );
}
