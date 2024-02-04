import { Module, ModuleMetadata, Type } from '@nestjs/common';
import { yalcBaseAppModuleMetadataFactory } from '@nestjs-yalc/framework/app/base-app-module.helper.js';
import { YalcAppUserApiModule } from '@nestjs-yalc/app-user/app-user-api.module.js';

function createYalcPlatformAppMetadata(module: Type<any>): ModuleMetadata {
  return yalcBaseAppModuleMetadataFactory(module, 'USER_API', {
    imports: [YalcAppUserApiModule],
  });
}

@Module(createYalcPlatformAppMetadata(YalcPlatformAppModule))
export class YalcPlatformAppModule {}
