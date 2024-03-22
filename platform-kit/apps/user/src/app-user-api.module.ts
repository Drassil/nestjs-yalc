import { Module, ModuleMetadata, Type } from '@nestjs/common';
import { YalcUserModule } from './user.module.ts';
import { yalcBaseAppModuleMetadataFactory } from '@nestjs-yalc/app/base-app-module.helper.ts';

function createYalcAppUserApiModuleMetadata(module: Type<any>): ModuleMetadata {
  return yalcBaseAppModuleMetadataFactory(module, 'USER_API', {
    imports: [YalcUserModule],
  });
}

@Module(createYalcAppUserApiModuleMetadata(YalcAppUserApiModule))
export class YalcAppUserApiModule {}
