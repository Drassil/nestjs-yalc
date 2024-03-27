import { Module, Type } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { skeletonUserProvidersFactory } from './user.resolver.js';
import { yalcPhoneProviderFactory } from './user-phone.resolver.js';
import { YalcGraphQL } from '@nestjs-yalc/graphql/graphql.module.js';
import { YalcUserEntity } from './user.entity.js';
import { YalcUserPhoneEntity } from './user-phone.entity.js';
import { YalcEventService } from '@nestjs-yalc/event-manager';
import { AppConfigService } from '@nestjs-yalc/app/app-config.service.js';
import { yalcBaseAppModuleMetadataFactory } from '@nestjs-yalc/app/base-app-module.helper.js';

const userModuleBootstrap = (module: Type<any>) => {
  const skeletonPhoneProviders = yalcPhoneProviderFactory('default');
  const skeletonUserProviders = skeletonUserProvidersFactory('default');

  return yalcBaseAppModuleMetadataFactory(module, 'user-app', {
    imports: [
      TypeOrmModule.forRootAsync({
        name: 'default',
        inject: [
          getAppConfigToken(APP_ALIAS_RESOURCE),
          getAppEventToken(APP_ALIAS_RESOURCE),
        ],
        useFactory: async (
          configService: AppConfigService<IResourceAppConf>,
          eventService: YalcEventService,
        ) => {
          const conf = configService.values;
          return {
            type: 'postgres',
            name: 'default',
            host: conf.postgres.host,
            port: conf.postgres.port,
            username: conf.postgres.username,
            password: conf.postgres.password,
            database: conf.postgres.database,
            entities: [YalcUserEntity, YalcUserPhoneEntity],
            schema: conf.schema,
            // synchronize: true,
            namingStrategy: new SnakeNamingStrategy(),
            migrations: options?.migrations,
            logger: new TypeORMLogger(eventService),
          };
        },
      }),
      TypeOrmModule.forFeature(
        [skeletonPhoneProviders.repository, skeletonUserProviders.repository],
        'default',
      ),
      YalcGraphQL,
    ],
    providers: [
      ...skeletonPhoneProviders.providers,
      ...skeletonUserProviders.providers,
    ],
  });
};

@Module(userModuleBootstrap(YalcUserModule))
export class YalcUserModule {}
