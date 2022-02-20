/* istanbul ignore file */
import { BaseEntity } from 'typeorm';

export class ExtendedBaseEntity extends BaseEntity {
  first = 1;
  second = 'second';
  third = "{test: 'testtest'}";
}
