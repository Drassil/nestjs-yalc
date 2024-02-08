import { Module, ModuleMetadata, Type } from '@nestjs/common';
import { YalcUserModule } from './user.module.js';
import { yalcBaseAppModuleMetadataFactory } from '@nestjs-yalc/app/base-app-module.helper.js';

function createYalcAppUserApiModuleMetadata(module: Type<any>): ModuleMetadata {
  return yalcBaseAppModuleMetadataFactory(module, 'USER_API', {
    imports: [YalcUserModule],
  });
}

@Module(createYalcAppUserApiModuleMetadata(YalcAppUserApiModule))
export class YalcAppUserApiModule {}
