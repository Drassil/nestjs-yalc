import { AgGridDependencyFactory } from '@nestjs-yalc/ag-grid/ag-grid.helpers';
import { UseGuards } from '@nestjs/common';
import {
  SkeletonUserType,
  SkeletonUserCreateInput,
  SkeletonUserUpdateInput,
  SkeletonUserCondition,
} from './dto/skeleton-user.type';
import { SkeletonUser } from './persistance/skeleton-user.entity';
import { RoleAuth, RoleEnum } from './role.guard';

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
          decorators: [UseGuards(RoleAuth([RoleEnum.PUBLIC]))],
          idName: 'guid',
          queryParams: {
            // name: 'getSkeletonUser',
            description: 'Role: user. Get a specific user',
          },
        },
        getResourceGrid: {
          decorators: [UseGuards(RoleAuth([RoleEnum.PUBLIC]))],
          queryParams: {
            // name: 'getSkeletonUserGrid',
            description: 'Role: user. Get a list of users',
          },
        },
      },
      mutations: {
        createResource: {
          decorators: [UseGuards(RoleAuth([RoleEnum.PUBLIC]))],
          queryParams: {
            // name: 'createSkeletonUser',
            description: 'Role: user. Create a new user',
          },
        },
        updateResource: {
          decorators: [UseGuards(RoleAuth([RoleEnum.PUBLIC]))],
          queryParams: {
            // name: 'updateSkeletonUser',
            description: 'Role: user. Update an existing user',
          },
        },
        deleteResource: {
          decorators: [UseGuards(RoleAuth([RoleEnum.PUBLIC]))],
          queryParams: {
            // name: 'deleteSkeletonUser',
            description: 'Role: user. Delete an existing user',
          },
        },
      },
    },

    service: { dbConnection },
    dataloader: { databaseKey: 'guid' },
  });
