import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { IFieldMapper } from '@nestjs-yalc/interfaces/maps.interface.js';
import {
  CGQueryDto,
  PageData,
  PaginatedResultDto,
} from './crud-gen-rest.dto.js';
import { objectMapperInterceptor } from '@nestjs-yalc/utils/object-mapper.interceptor.js';
import { ObjectMapperType } from '@nestjs-yalc/utils/object-mapper.helper.js';
import { buildSimpleMapperInterceptor } from '@nestjs-yalc/utils/simple-mapper.interceptor.js';
import { ClassType } from '@nestjs-yalc/types/globals.d.js';
import { Observable } from 'rxjs';
import { plainToInstance } from 'class-transformer';

export function crudGenRestPaginationInterceptorWorker<T>(
  startRow?: number,
  endRow?: number,
) {
  return ([page, count]: [T, number]) => {
    return {
      list: page,
      pageData: { count, startRow: startRow ?? 0, endRow: endRow ?? count },
    };
  };
}

/**
 * This interceptor is used to add pagination to the response
 * by creating an object with the following structure:
 * {
 *   list: [data],
 *   pageData: {
 *     count: number,
 *     startRow: number,
 *     endRow: number,
 *    }
 */
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

export function buildCrudGenRestSimpleMapperInterceptor<
  TInputObject extends Record<string, any> = any,
  TOutputObject extends Record<string, any> = any,
>(
  dto: new (data: TInputObject) => TOutputObject,
  withPagination: boolean = false,
) {
  return buildSimpleMapperInterceptor<TInputObject, TOutputObject>(dto, {
    transformer: (data) => {
      return withPagination ? data[0] : data; // with pagination, data is [data, count]
    },
    callback: (inputData, data) => {
      return withPagination ? [data, inputData[1]] : data; // [data, count] or data
    },
  });
}

export function buildPaginatedResultDto<T>(
  dto: new (...args: any[]) => T,
): new (data: T[], pageData: PageData) => PaginatedResultDto<T> {
  class NewPaginatedResultDto extends PaginatedResultDto<T> {
    constructor(data: T[], pageData: PageData) {
      super(
        data.map((item) => plainToInstance<T, any>(dto, item)),
        pageData,
      );
    }
  }
  return NewPaginatedResultDto;
}

/**
 * Can be used in combination with the ClassSerializerInterceptor
 */
export function buildPaginatedDTOInterceptor<T>(
  dto: new (...args: any[]) => T,
): ClassType<NestInterceptor> {
  @Injectable()
  class PaginateDTOInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const http = context.switchToHttp();
      const request = http.getRequest();

      const params: CGQueryDto = request.query ?? {};

      const { startRow, endRow } = params;

      return next.handle().pipe(
        map(([data, count]) => {
          const PaginatedDto = buildPaginatedResultDto(dto);
          const res = new PaginatedDto(data, {
            count,
            startRow: startRow ?? 0,
            endRow: endRow ?? count,
          });
          return res;
        }),
      );
    }
  }

  return PaginateDTOInterceptor;
}

/**
 * Can be used in combination with the ClassSerializerInterceptor
 */
export function buildDTOInterceptor<T>(
  dto: new (...args: any[]) => T,
): ClassType<NestInterceptor> {
  @Injectable()
  class DtoInterceptor implements NestInterceptor {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(
        map((data) => {
          return plainToInstance<T, any>(dto, data);
        }),
      );
    }
  }

  return DtoInterceptor;
}
