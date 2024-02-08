import { CrudGenDependencyFactory } from '@nestjs-yalc/crud-gen/crud-gen.helpers.js';
import {
  SkeletonPhoneType,
  SkeletonPhoneCreateInput,
  SkeletonPhoneUpdateInput,
  SkeletonPhoneCondition,
} from './user-phone.dto.js';
import { SkeletonPhone } from './user-phone.entity.js';

export const skeletonPhoneProvidersFactory = (dbConnection: string) =>
  CrudGenDependencyFactory<SkeletonPhone>({
    // The model used for TypeORM
    entityModel: SkeletonPhone,
    resolver: {
      dto: SkeletonPhoneType,
      input: {
        create: SkeletonPhoneCreateInput,
        update: SkeletonPhoneUpdateInput,
        conditions: SkeletonPhoneCondition,
      },
      prefix: 'SkeletonModule_',
    },
    service: { dbConnection },
    dataloader: { databaseKey: 'phoneNumber' },
  });
