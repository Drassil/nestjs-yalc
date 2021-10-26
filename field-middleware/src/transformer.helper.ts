import { belongsToEnum } from '@nestjs-yalc/utils/enum.helper';
import { ValueTransformer } from 'typeorm';

/**
 * Function for transforming the unfitting enum data to null after reading it from the database
 * @param enumName: enum object for checking if the column value belongs to it
 * @returns ValueTransformer object
 */
export const enumTransformer = <T>(enumName: T): ValueTransformer => {
  const transformer = (value: string | number) => {
    return belongsToEnum(enumName, value) ? value : null;
  };

  return {
    to: (value) => value, // no transformation for writing
    from: transformer,
  };
};
