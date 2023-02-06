import { CrudGenDependencyFactory } from '@nestjs-yalc/crud-gen/crud-gen.helpers.js';
import { resolverFactory } from '@nestjs-yalc/crud-gen/generic-resolver.resolver.js';
import { GQLDataLoader } from '@nestjs-yalc/data-loader/dataloader.helper.js';
import returnValue from '@nestjs-yalc/utils/returnValue.js';
import { UseGuards } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { GqlExecutionContext, Mutation, Resolver } from '@nestjs/graphql';
import {
  SkeletonUserType,
  SkeletonUserCreateInput,
  SkeletonUserUpdateInput,
  SkeletonUserCondition,
} from './skeleton-user.dto.js';
import { SkeletonUser } from './skeleton-user.entity.js';
import { RoleAuth, RoleEnum } from './role.guard.js';
import {
  skeletonUserServiceFactory,
  SkeletonUserService,
} from './skeleton-user.service.js';
import { InputArgs } from '@nestjs-yalc/crud-gen/gqlmapper.decorator.js';
import {
  ExtraArgsStrategy,
  FilterType,
  GeneralFilters,
} from '@nestjs-yalc/crud-gen/crud-gen.enum.js';

export const lowerCaseEmailMiddleware = (
  _ctx: GqlExecutionContext,
  input: SkeletonUserType,
  value: boolean,
) => {
  if (value === true) {
    input.email = input.email.toLowerCase();
  }
};

@Resolver(returnValue(SkeletonUserType))
export class SkeletonUserResolver extends resolverFactory({
  entityModel: SkeletonUser,
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
        description: 'Get a specific user',
      },
    },
    getResourceGrid: {
      decorators: [UseGuards(RoleAuth([RoleEnum.PUBLIC]))],
      extraArgs: {
        firstName: {
          filterCondition: GeneralFilters.CONTAINS,
          filterType: FilterType.TEXT,
          options: {
            type: returnValue(String),
            nullable: true,
          },
        },
        lastName: {
          filterCondition: GeneralFilters.CONTAINS,
          filterType: FilterType.TEXT,
          options: {
            type: returnValue(String),
            nullable: true,
          },
        },
      },
      extraArgsStrategy: ExtraArgsStrategy.AT_LEAST_ONE,
      queryParams: {
        // name: 'getSkeletonUserGrid',
        description: 'Get a list of users',
      },
    },
  },
  mutations: {
    createResource: {
      decorators: [UseGuards(RoleAuth([RoleEnum.PUBLIC]))],
      extraInputs: {
        lowerCaseEmail: {
          gqlOptions: {
            description: 'Force the email to be in lowercase',
            type: returnValue(Boolean),
            defaultValue: true,
            nullable: true,
          },
          middleware: lowerCaseEmailMiddleware,
        },
      },
      queryParams: {
        // name: 'createSkeletonUser',
        description: 'Create a new user',
      },
    },
    updateResource: {
      decorators: [UseGuards(RoleAuth([RoleEnum.PUBLIC]))],
      queryParams: {
        // name: 'updateSkeletonUser',
        description: 'Update an existing user',
      },
    },
    deleteResource: {
      decorators: [UseGuards(RoleAuth([RoleEnum.PUBLIC]))],
      queryParams: {
        // name: 'deleteSkeletonUser',
        description: 'Delete an existing user',
      },
    },
  },
}) {
  constructor(
    protected service: SkeletonUserService,
    protected dataloader: GQLDataLoader,
    protected moduleRef: ModuleRef,
  ) {
    super(service, dataloader, moduleRef);
  }

  @UseGuards(RoleAuth([RoleEnum.PUBLIC]))
  @Mutation(returnValue(String), {
    description:
      'Reset user password with a random one and send the new value back.',
  })
  public async SkeletonModule_generateRandomPassword(
    @InputArgs({
      _name: 'ID',
    })
    ID: string,
  ): Promise<string> {
    return this.service.resetPassword(ID);
  }
}

export const skeletonUserProvidersFactory = (dbConnection: string) =>
  CrudGenDependencyFactory<SkeletonUser>({
    // The model used for TypeORM
    entityModel: SkeletonUser,
    resolver: {
      provider: SkeletonUserResolver,
    },

    service: {
      dbConnection: dbConnection,
      entityModel: SkeletonUser,
      provider: {
        provide: 'SkeletonUserGenericService',
        useClass: skeletonUserServiceFactory(dbConnection),
      },
    },
    dataloader: { databaseKey: 'guid' },
  });
