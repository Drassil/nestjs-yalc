import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AgGridRepository } from '@nestjs-yalc/ag-grid/ag-grid.repository';
import { GQLDataLoader } from '@nestjs-yalc/data-loader/dataloader.helper';
import { ModuleRef } from '@nestjs/core';
import 'reflect-metadata';
import { lowerCaseEmailMiddleware, SkeletonUserResolver } from '../index';
import { SkeletonUser } from '../persistance/skeleton-user.entity';
import {
  SkeletonUserService,
  skeletonUserServiceFactory,
} from '../skeleton-user.service';

describe('Test skeleton user resolver', () => {
  let mockedRepository: DeepMocked<AgGridRepository<SkeletonUser>>;
  let mockedDataloader: DeepMocked<GQLDataLoader<SkeletonUser>>;
  let mockedModuleRef: DeepMocked<ModuleRef>;
  let userService: SkeletonUserService;

  beforeEach(() => {
    mockedRepository = createMock<AgGridRepository<SkeletonUser>>();
    mockedDataloader = createMock<GQLDataLoader<SkeletonUser>>();
    mockedModuleRef = createMock<ModuleRef>();
    const serviceFactory = skeletonUserServiceFactory('test');
    userService = new serviceFactory(mockedRepository);
  });

  it('should create the resolver', () => {
    const resolver = new SkeletonUserResolver(
      userService,
      mockedDataloader,
      mockedModuleRef,
    );

    expect(resolver).toBeDefined();
  });

  it('should have working methods', () => {
    const resolver = new SkeletonUserResolver(
      userService,
      mockedDataloader,
      mockedModuleRef,
    );

    const randomPass = resolver.generateRandomPassword('TEST');

    expect(randomPass).toBeDefined();
  });

  it('should execute the middleware', () => {
    const input: any = { email: 'TEST@TEST.COM' };

    lowerCaseEmailMiddleware({} as any, input, true);

    expect(input).toEqual({ email: 'test@test.com' });
  });
});
