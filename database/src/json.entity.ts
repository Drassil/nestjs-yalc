import { ClassType, Mixin } from '@nestjs-yalc/types/globals.js';
import { BeforeUpdate, Entity } from 'typeorm';
import { NYALC_JSON_FIELD_META_KEY } from './json.helpers.js';

/**
 * Mixin
 */
export const JsonEntityMixin = <T extends ClassType>(base: T) => {
  @Entity()
  class JsonEntityMixin extends base {
    @BeforeUpdate()
    updateData() {
      const metadata: { [key: string]: boolean } = Reflect.getMetadata(
        NYALC_JSON_FIELD_META_KEY,
        this.constructor.prototype,
      );

      Object.entries(metadata).map(([k, v]) => {
        if (v !== true || !this[k]) return;
        const newData = JSON.stringify(this[k]).replace(/'/g, "\\'");
        this[k] = () => `JSON_MERGE_PATCH(${k}, '${newData}')`;
      });
    }
  }

  return JsonEntityMixin;
};

export type JsonEntityMixin = Mixin<typeof JsonEntityMixin>;
