import { Module, ModuleMetadata, Type } from '@nestjs/common';
import { yalcBaseAppModuleMetadataFactory } from '@nestjs-yalc/app/base-app-module.helper.ts';
import { YalcAppUserApiModule } from '@nestjs-yalc/pk-app-user/app-user-api.module.ts';

export const YALC_ALIAS_PLATFORM = 'yalc-platform';

function createYalcPlatformAppMetadata(module: Type<any>): ModuleMetadata {
  return yalcBaseAppModuleMetadataFactory(module, YALC_ALIAS_PLATFORM, {
    imports: [YalcAppUserApiModule],
  });
}

@Module(createYalcPlatformAppMetadata(YalcPlatformAppModule))
export class YalcPlatformAppModule {}
