import { Module, ModuleMetadata, Type } from '@nestjs/common';
import { UserModule } from './user.module.js';
import { yalcBaseAppModuleMetadataFactory } from '@nestjs-yalc/framework/app/src/base-app-module.helper.js';

function createUserModuleMetadata(module: Type<any>): ModuleMetadata {
  return yalcBaseAppModuleMetadataFactory(module, 'USER_API', {
    imports: [UserModule],
  });
}

@Module(createUserModuleMetadata(UserModule))
export class UserApiModule {}
