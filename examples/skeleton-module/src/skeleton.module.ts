import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { skeletonUserProvidersFactory } from './skeleton-user.resolver.js';
import { skeletonPhoneProvidersFactory } from './skeleton-phone.resolver.js';

@Module({})
export class SkeletonModule {
  static register(dbConnection: string): DynamicModule {
    const skeletonPhoneProviders = skeletonPhoneProvidersFactory(dbConnection);
    const skeletonUserProviders = skeletonUserProvidersFactory(dbConnection);

    return {
      module: SkeletonModule,
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
