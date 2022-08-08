import { AgGridDependencyFactory } from 'crud-gen/src/ag-grid.helpers';
import {
  SkeletonPhoneType,
  SkeletonPhoneCreateInput,
  SkeletonPhoneUpdateInput,
  SkeletonPhoneCondition,
} from './dto/skeleton-phone.type';
import { SkeletonPhone } from './persistance/skeleton-phone.entity';

export const skeletonPhoneProvidersFactory = (dbConnection: string) =>
  AgGridDependencyFactory<SkeletonPhone>({
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
