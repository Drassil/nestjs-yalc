import { ClassType } from '@nestjs-yalc/types/globals.js';
import { deepMerge, objectSetProp } from '@nestjs-yalc/utils/object.helper.js';
import { plainToInstance } from 'class-transformer';

export function JsonTransformer(field: string, propertyPath: string) {
  return (dstObj: Record<any, any>, srcValue: any): any => {
    const patch = objectSetProp({}, propertyPath, srcValue);
    return deepMerge(dstObj[field] ?? {}, patch);
  };
}

export interface IYalcTransformer<TSrc> {
  onAfterTransform?: { (srcObj: TSrc): void };
}

export function isYalcTransformerGuard<TSrc>(
  obj: any,
): obj is IYalcTransformer<TSrc> {
  return obj?.onAfterTransform !== undefined;
}

export function yalcPlainToInstance<TSrc, TDest>(
  cls: ClassType<TDest | IYalcTransformer<TSrc>>,
  plain: TSrc,
): TDest {
  const instance = plainToInstance(cls, plain);
  if (isYalcTransformerGuard<TSrc>(instance)) {
    instance.onAfterTransform?.(plain);
    delete instance.onAfterTransform;
  }

  return instance as TDest;
}
