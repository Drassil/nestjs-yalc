import { deepMerge, objectSetProp } from '@nestjs-yalc/utils/object.helper.js';

export function JsonTransformer(field: string, propertyPath: string) {
  return (dstObj: Record<any, any>, srcValue: any): any => {
    const patch = objectSetProp({}, propertyPath, srcValue);
    return deepMerge(dstObj[field] ?? {}, patch);
  };
}
