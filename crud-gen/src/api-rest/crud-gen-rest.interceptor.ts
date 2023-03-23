import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { IFieldMapper } from '@nestjs-yalc/interfaces/maps.interface.js';
import { CGQueryDto } from './crud-gen-rest.dto.js';

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
