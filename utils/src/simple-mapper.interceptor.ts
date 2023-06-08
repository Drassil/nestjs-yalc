import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

/**
 *
 * @param Dto
 * @param transformer used to transform the data before mapping it to the DTO.
 * This is useful when the data is not in the correct format to be mapped to the DTO.
 * @returns
 */
export function buildSimpleMapperInterceptor<T, R>(
  Dto: new (data: T) => R,
  transformer: (data: T) => T = (data) => data,
): new () => NestInterceptor<T, R> {
  @Injectable()
  class SimpleMapper implements NestInterceptor<T, R> {
    intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<R> {
      return next.handle().pipe(map((data) => new Dto(transformer(data))));
    }
  }

  return SimpleMapper;
}
