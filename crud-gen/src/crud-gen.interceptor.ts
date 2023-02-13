import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { IFieldMapper } from '@nestjs-yalc/interfaces/maps.interface.js';
import { GqlExecutionContext } from '@nestjs/graphql';

export function crudGenInterceptorWorker<T>(startRow: number, endRow: number) {
  return ([page, count]: [T, number]) => {
    return {
      nodes: page,
      pageData: { count, startRow: startRow ?? 0, endRow: endRow ?? count },
    };
  };
}
@Injectable()
export class CrudGenInterceptor<T = IFieldMapper>
  implements NestInterceptor<T> {
  intercept(context: ExecutionContext, next: CallHandler) {
    const gqlCtx = GqlExecutionContext.create(context);
    const { startRow, endRow } = gqlCtx.getArgs();
    return next.handle().pipe(map(crudGenInterceptorWorker(startRow, endRow)));
  }
}
