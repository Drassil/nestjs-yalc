import { ObjectType } from 'typeorm';

export function returnValue<T>(value: string | boolean | number): {
  (): T;
};
export function returnValue<T>(value: T): { (): ObjectType<T> };
export function returnValue<T>(value: T): { (): T | ObjectType<T> } {
  return () => value;
}

/**
 * Helper function for typeorm decorators
 */
export const returnProperty = <T>(
  property: keyof T,
): { (relationEntity: T): T[keyof T] } => {
  return (relationEntity: T) => relationEntity[property];
};

export default returnValue;
