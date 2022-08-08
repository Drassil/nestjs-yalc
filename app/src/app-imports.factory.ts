/* istanbul ignore file */

import { ImportType } from '@nestjs-yalc/interfaces/nestjs.type';
import { Logger, ModuleMetadata, Provider } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLSchema } from 'graphql';
import {
  wrapSchema,
  RenameTypes,
  RenameRootFields,
  RenameRootTypes,
  RenameInterfaceFields,
  RenameInputObjectFields,
} from '@graphql-tools/wrap';
import { AppContextModule } from './app-context.module';
import { AppContextService } from './app-context.service';
import { IDbConfType } from '@nestjs-yalc/database/conf.interface';
import { getConfNameByConnection } from '@nestjs-yalc/database/conn.helper';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuildSchemaOptions, GraphQLFederationModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { IServiceConf } from './conf.type';
import { GraphQLError } from 'graphql/error';
import { GraphQLFormattedError } from 'graphql/error';
import { AppLoggerModule } from '../logger/app-logger.module';
import { TypeORMLogger } from '@nestjs-yalc/logger/typeorm-logger';
import { CURAPP_CONF_ALIAS } from './def.const';
import { AppEvents } from './app.events';
import { GqlComplexityPlugin } from '@nestjs-yalc/graphql/plugins/gql-complexity.plugin';
import { ApolloServerPlugin } from 'apollo-server-plugin-base';
import { ClassType } from '@nestjs-yalc/types';
import { isClass } from '@nestjs-yalc/utils/class.helper';

import * as dotenv from 'dotenv';
dotenv.config(); // preload .env root file before all the others

export interface IAppImportsFactory {
  envPath?: string | string[];
  setupEvents?: boolean;
  setupJwt?: boolean;
  keepDBConnectionAlive?: boolean;
  operationPrefix?: string;
  buildSchemaOptions?: BuildSchemaOptions;
  gqlPlugin?: ClassType<ApolloServerPlugin>[];
  disablePlayground?: boolean;
}
type PickModuleMetadata = 'imports' | 'providers' | 'exports';
export type AppModuleMetadata = Required<
  Pick<ModuleMetadata, PickModuleMetadata>
>;

/**
 * This factory function can be reused within tests to
 * create a test app module with the same imports of the actual app
 */
export function AppDependencyFactory(
  context: string,
  confs: any[],
  dbConnNames: string[],
  gqlModules: any[],
  options?: IAppImportsFactory,
): AppModuleMetadata {
  const {
    setupEvents = true,
    setupJwt = true,
    keepDBConnectionAlive = false,
    buildSchemaOptions = {},
    disablePlayground = false,
  } = options ?? {};

  const envPath: string[] = [];

  if (!options?.envPath) {
    envPath.push('.env'); // user-defined env (git-ignored)

    if (process.env.NODE_ENV) {
      envPath.push(`.env.${process.env.NODE_ENV}`); // user-defined env (git-ignored)

      // .env.shared is always loaded except in production
      if (process.env.NODE_ENV !== 'production')
        envPath.push('conf/dist/.env.shared');

      if (process.env.DOCKER_CONTAINER === '1')
        envPath.push(`conf/dist/.env.docker.${process.env.NODE_ENV}`);
      else {
        envPath.push(`conf/dist/.env.local.${process.env.NODE_ENV}`);
      }
    }
  }

  Logger.debug?.(`Using ${envPath}, for environment: ${process.env.NODE_ENV}`);

  const configModule = ConfigModule.forRoot({
    load: confs,
    envFilePath: envPath,
    isGlobal: true,
  });

  // configModule and AppContextModule must be global to avoid
  // import (re-instantiating) them when they are required by other modules
  const imports: ImportType[] = [
    configModule,
    AppLoggerModule.forRoot(context, configModule),
    AppContextModule,
    HttpModule,
  ];

  if (dbConnNames.length) {
    dbConnNames.forEach((connName) => {
      imports.push(
        TypeOrmModule.forRootAsync({
          inject: [ConfigService, TypeORMLogger],
          name: connName,
          useFactory: async (
            configService: ConfigService,
            logger: TypeORMLogger,
          ) => {
            const conf = configService.get<IDbConfType>(
              getConfNameByConnection(connName),
            );

            logger.log?.(
              'log',
              `Connecting DB ${connName} to host: ${conf?.host}`,
            );
            return {
              ...conf,
              logger: conf?.logging ? logger : undefined,
              maxQueryExecutionTime: 1000,
              keepConnectionAlive: keepDBConnectionAlive,
            };
          },
        }),
      );
    });
  }

  const providers: Provider<any>[] = [];

  class ApolloPluginsModule {
    static forRoot() {
      return {
        module: ApolloPluginsModule,
        providers: [
          {
            provide: 'APOLLO_PLUGINS',
            useFactory: (...gqlPlugins: ApolloServerPlugin[]) => {
              return gqlPlugins;
            },
            inject: [...(options?.gqlPlugin ?? [])],
          },
        ],
        exports: ['APOLLO_PLUGINS'],
      };
    }
  }

  if (gqlModules.length) {
    imports.push(
      GraphQLFederationModule.forRootAsync({
        imports: [ApolloPluginsModule.forRoot()],
        useFactory: async (
          configService: ConfigService,
          appContext: AppContextService,
          eventEmitter: EventEmitter2,
          gqlPluginList: ApolloServerPlugin[],
        ) => {
          const conf = configService.get<IServiceConf>(CURAPP_CONF_ALIAS);
          return {
            autoSchemaFile: true,
            buildSchemaOptions,
            // can cause performance issues (https://docs.nestjs.com/graphql/other-features#execute-enhancers-at-the-field-resolver-level)
            // be careful
            fieldResolverEnhancers: ['interceptors', 'guards', 'filters'],
            transformAutoSchemaFile: true,
            transformSchema: (graphQLSchema: GraphQLSchema) => {
              const opPrefix =
                options?.operationPrefix ?? conf?.operationPrefix;

              const rename = (name: string) => {
                // _service, _entities etc. are used by federation and must not be renamed
                if (!opPrefix || name.startsWith('_')) return name;

                // orphaned types must keep their non-prefixed name
                if (
                  options?.buildSchemaOptions?.orphanedTypes?.some(
                    (cl) => isClass(cl) && cl.name === name,
                  )
                )
                  return name;

                return `${opPrefix}_${name}`;
              };

              const transformed = wrapSchema({
                schema: graphQLSchema,
                transforms: [
                  new RenameInputObjectFields((_, name) => rename(name)),
                  new RenameInterfaceFields((_, name) => rename(name)),
                  new RenameRootTypes((name) => rename(name)),
                  new RenameTypes((name) => rename(name)),
                  new RenameRootFields((_operationName, name) => rename(name)),
                ],
              });

              appContext.setSchema(transformed);

              return transformed;
            },
            include: gqlModules,
            useGlobalPrefix: true,
            // Makes sure not too much info. is revealed when reporting errors in non-dev stages
            // @url: https://github.com/nestjs/graphql/issues/1053#issuecomment-740739410
            formatError: (error: GraphQLError) => {
              const message =
                error.extensions?.exception?.response?.message || error.message;

              if (conf && (conf.isDev || conf.isTest)) {
                return {
                  ...error,
                  message, // override the message with meaningful info
                };
              }

              // throw only essential error info in production
              const productionError: GraphQLFormattedError = {
                message,
                extensions: {
                  path: error.path,
                  code: error.extensions?.code,
                  exception: error.originalError, // error without stacktrace
                },
              };

              return productionError;
            },
            playground:
              conf?.isDev && !disablePlayground
                ? {
                    endpoint: `${conf?.apiPrefix}/graphql`,
                    settings: { 'request.credentials': 'include' },
                  }
                : false,
            debug: conf?.isDev,
            context: async ({ request, reply, ...rest }) => {
              await eventEmitter.emitAsync(
                AppEvents.BEFORE_GQL_CONTEXT_MIDDLEWARE,
                request,
                reply,
              );

              return {
                request,
                response: reply,
                ...rest,
              };
            },
            plugins: [new GqlComplexityPlugin(), ...gqlPluginList],
          };
        },
        inject: [
          ConfigService,
          AppContextService,
          EventEmitter2,
          'APOLLO_PLUGINS',
        ],
      }),
    );
  }

  if (setupEvents) {
    imports.push(EventEmitterModule.forRoot());
  }

  if (setupJwt) {
    imports.push(
      JwtModule.registerAsync({
        imports: [configModule],
        useFactory: async (configService: ConfigService) => ({
          secret: configService.get<IServiceConf>(CURAPP_CONF_ALIAS)
            ?.jwtSecretPrivate,
          signOptions: {
            expiresIn: 3600,
          },
        }),
        inject: [ConfigService],
      }),
    );
  }

  return {
    imports,
    providers,
    exports: [],
  };
}
