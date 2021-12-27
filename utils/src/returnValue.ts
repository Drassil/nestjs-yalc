import { ObjectType } from "typeorm";

export const returnValue = <T>(value: any): { (): ObjectType<T> } => {
  return () => value;
};

/**
 * Helper function for typeorm decorators
 */
export const returnProperty = <T>(
  property: keyof T
): { (relationEntity: T): T[keyof T] } => {
  return (relationEntity: T) => relationEntity[property];
};

export default returnValue;
