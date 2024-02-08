import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { skeletonUserProvidersFactory } from './user.resolver.js';
import { skeletonPhoneProvidersFactory } from './user-phone.resolver.js';

@Module({})
export class YalcUserModule {
  static register(dbConnection: string): DynamicModule {
    const skeletonPhoneProviders = skeletonPhoneProvidersFactory(dbConnection);
    const skeletonUserProviders = skeletonUserProvidersFactory(dbConnection);

    return {
      module: YalcUserModule,
      imports: [
        TypeOrmModule.forFeature(
          [skeletonPhoneProviders.repository, skeletonUserProviders.repository],
          dbConnection,
        ),
      ],
      providers: [
        ...skeletonPhoneProviders.providers,
        ...skeletonUserProviders.providers,
      ],
    };
  }
}
