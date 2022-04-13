import { AgGridDependencyFactory } from '@nestjs-yalc/ag-grid/ag-grid.helpers';
import {
  SkeletonUserType,
  SkeletonUserCreateInput,
  SkeletonUserUpdateInput,
  SkeletonUserCondition,
} from './dto/skeleton-user.type';
import { SkeletonUser } from './persistance/skeleton-user.entity';

export const skeletonUserProvidersFactory = (dbConnection: string) =>
  AgGridDependencyFactory<SkeletonUser>({
    // The model used for TypeORM
    entityModel: SkeletonUser,
    resolver: {
      dto: SkeletonUserType,
      input: {
        create: SkeletonUserCreateInput,
        update: SkeletonUserUpdateInput,
        conditions: SkeletonUserCondition,
      },
      prefix: 'SkeletonModule_',
      queries: {
        // SkeletonModule_getSkeletonUser
        getResource: {
          // decorators: [Auth([RoleEnum.ADMIN])],
          idName: 'guid',
          queryParams: {
            // name: 'getSkeletonUser',
            description: 'Role: admin. Get a specific user',
          },
        },
        getResourceGrid: {
          // decorators: [Auth([RoleEnum.ADMIN])],
          queryParams: {
            // name: 'getSkeletonUserGrid',
            description: 'Role: admin. Get a list of users',
          },
        },
      },
      mutations: {
        createResource: {
          decorators: [
            // Auth([RoleEnum.ADMIN]),
          ],
          queryParams: {
            // name: 'createSkeletonUser',
            description: 'Role: admin. Create a new user',
          },
        },
        updateResource: {
          decorators: [
            // Auth([RoleEnum.ADMIN]),
          ],
          queryParams: {
            // name: 'updateSkeletonUser',
            description: 'Role: admin. Update an existing user',
          },
        },
        deleteResource: {
          decorators: [
            // Auth([RoleEnum.ADMIN]),
          ],
          queryParams: {
            // name: 'deleteSkeletonUser',
            description: 'Role: admin. Delete an existing user',
          },
        },
      },
    },

    service: { dbConnection },
    dataloader: { databaseKey: 'guid' },
  });
