import {
  APP_ALIAS_RESOURCE,
  APP_RESOURCE_LOGGER_CONTEXT,
} from '../resource.defs.js';

import { IDbBaseAppConf } from '@fung-libs/base-app/app-conf.type.js';
import {
  BaseConfFactory,
  getPostgresEnv,
} from '@fung-libs/base-app/app-conf.factory.js';

export interface IResourceAppConf extends IDbBaseAppConf {
  schema: string;
}

export const ConfFactory = async (): Promise<IResourceAppConf> => {
  return {
    ...BaseConfFactory({
      appName: APP_ALIAS_RESOURCE,
      logContextLevels: [APP_RESOURCE_LOGGER_CONTEXT],
    }),
    port: parseInt(process.env.RESOURCE_PORT || '60101'), // used when started via nestjs cli
    postgres: getPostgresEnv(),
    schema: 'resource',
  };
};
