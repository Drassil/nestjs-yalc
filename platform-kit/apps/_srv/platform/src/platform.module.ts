import { Module, ModuleMetadata, Type } from '@nestjs/common';
import { yalcBaseAppModuleMetadataFactory } from '@nestjs-yalc/app/base-app-module.helper.ts';
import { YalcAppUserApiModule } from '@nestjs-yalc/pk-app-user/app-user-api.module.ts';

function createYalcPlatformAppMetadata(module: Type<any>): ModuleMetadata {
  return yalcBaseAppModuleMetadataFactory(module, 'USER_API', {
    imports: [YalcAppUserApiModule],
  });
}

@Module(createYalcPlatformAppMetadata(YalcPlatformAppModule))
export class YalcPlatformAppModule {}
