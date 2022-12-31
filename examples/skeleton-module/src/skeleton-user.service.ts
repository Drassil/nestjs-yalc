import { GenericService } from '@nestjs-yalc/crud-gen/generic-service.service';
import { SkeletonUser } from './skeleton-user.entity';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudGenRepository } from '@nestjs-yalc/crud-gen/crud-gen.repository';
import { ClassType } from '@nestjs-yalc/types';
import { Injectable } from '@nestjs/common';
import returnValue from '@nestjs-yalc/utils/returnValue';

export interface SkeletonUserService extends GenericService<SkeletonUser> {
  resetPassword(guid: string): Promise<string>;
}

// We are using a factory function to be able to pass the connection name dynamically
export const skeletonUserServiceFactory = (
  dbConnection: string,
): ClassType<SkeletonUserService> => {
  @Injectable()
  class SkeletonUserService
    extends GenericService<SkeletonUser>
    implements SkeletonUserService
  {
    constructor(
      @InjectRepository(SkeletonUser, dbConnection)
      protected repository: CrudGenRepository<SkeletonUser>,
    ) {
      super(repository);
    }

    async resetPassword(guid: string) {
      // create a new random password
      const newPass = Array(12)
        .fill('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
        .map(function (x) {
          return x[crypto.randomInt(0, 10_000) % x.length];
        })
        .join('');

      // update the selected user with the new password
      await this.getRepositoryWrite().update(
        { guid },
        { password: returnValue<string>(newPass) },
      );

      // send it back to the client
      return newPass;
    }
  }

  return SkeletonUserService;
};
