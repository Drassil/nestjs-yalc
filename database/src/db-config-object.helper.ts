import { envIsTrue } from '@nestjs-yalc/utils/env.helper.js';
import { EntitySchema } from 'typeorm';
import { Seeder } from '@jorgebodega/typeorm-seeding';
import { IDbConfObject } from './conf.interface.js';
import { getConnectionName } from './conn.helper.js';
import { MysqlConnectionCredentialsOptions } from 'typeorm/driver/mysql/MysqlConnectionCredentialsOptions.js';
// import { PostgresConnectionCredentialsOptions } from 'typeorm/driver/postgres/PostgresConnectionCredentialsOptions.js';
import { SqlServerConnectionCredentialsOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionCredentialsOptions.js';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions.js';
// import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
// import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions.js';

type ConnectionOptions = MysqlConnectionOptions;
// | PostgresConnectionOptions
// | SqlServerConnectionOptions;

type CredentialOptions =
  | MysqlConnectionCredentialsOptions
  // | PostgresConnectionCredentialsOptions -> the password field is incompatible
  | SqlServerConnectionCredentialsOptions;

/**
 * TypeORM doesn't provide a type for entities, TypeOrmEntityType has been created to improve
 * readability.
 */
// eslint-disable-next-line
type TypeOrmEntityType = Function | string | EntitySchema<any>;

type DbConfigObjectParams = {
  dbName?: string;
  entities: TypeOrmEntityType[];
  seeds?: { new (): Seeder }[];
  sourceDir?: string;
  migrationsDir?: string;
  extraMigrationDirs?: string[];
  connectionName?: string;
  synchronize?: boolean;
  /** used by the seeding service to do not seed this database sequentially (the order is not guaranteed) */
  __seedAsync?: boolean;
};

export function buildDbConfigObject({
  dbName,
  entities,
  seeds,
  sourceDir,
  migrationsDir,
  extraMigrationDirs,
  connectionName,
  synchronize,
  __seedAsync,
}: DbConfigObjectParams): IDbConfObject {
  let connNameTemp = connectionName;
  if (!connNameTemp && dbName) {
    connNameTemp = dbName;
  }
  if (!connNameTemp) {
    throw new Error(
      'Cannot create a connection without a name, provide at least a dbName or connectionName',
    );
  }
  const connName = getConnectionName(connNameTemp);

  const dbConfObj: IDbConfObject = () => {
    const noSelDb = envIsTrue(process.env.TYPEORM_NO_SEL_DB || 'false');

    const canLoad =
      envIsTrue(process.env.TYPEORM_LOAD_MIGRATIONS) ||
      process.env.NODE_ENV !== 'production';

    const migrationDirs = [];

    if (migrationsDir) {
      migrationDirs.push(`${migrationsDir}/**/*.{ts,js}`);
    }

    if (extraMigrationDirs) {
      migrationDirs.push(...extraMigrationDirs);
    }

    return {
      ..._getDefaultDbConnectionConfig(dbName),
      name: connName,
      database: noSelDb ? undefined : dbName,
      entities: noSelDb ? undefined : entities,
      seeds,
      factories:
        sourceDir && canLoad
          ? [`${sourceDir}/**/*.factory.{ts,js}`]
          : undefined,
      migrations:
        migrationDirs.length > 0 && canLoad ? migrationDirs : undefined,
      cli: {
        migrationsDir: canLoad ? migrationsDir : undefined,
      },
      __seedAsync,
      synchronize,
    };
  };

  dbConfObj.connName = connName;
  dbConfObj.dbName = dbName ?? connNameTemp;

  return dbConfObj;
}

type DbConfigParams =
  | CredentialOptions
  | ReplicationConnectionCredentialsOptions;

interface ReplicationConnectionCredentialsOptions {
  replication: {
    master: CredentialOptions;
    slaves: CredentialOptions[];
    selector?: 'RR' | 'RANDOM' | 'ORDER';
  };
}

function _getDefaultDbConnectionConfig(dbName?: string): ConnectionOptions {
  const { TYPEORM_SYNCHRONIZE } = process.env;
  const dbConfigParams = _makeDbConfigParams(dbName);

  return {
    ...dbConfigParams,
    type: 'mysql',
    supportBigNumbers: true,
    bigNumberStrings: false,
    synchronize: envIsTrue(TYPEORM_SYNCHRONIZE || 'false'),
    logging: true,
  };
}

function _makeDbConfigParams(dbName?: string): DbConfigParams {
  const { MYSQL_TOTAL_REPLICATION_NODES } = process.env;
  if (MYSQL_TOTAL_REPLICATION_NODES) {
    return _makeReplicatedDbConfigParams(
      parseInt(MYSQL_TOTAL_REPLICATION_NODES, 10),
      dbName,
    );
  }

  return _makeSingleDbConfigParams(dbName);
}

function _makeSingleDbConfigParams(dbName?: string): CredentialOptions {
  const {
    MYSQL_HOST,
    MYSQL_PORT,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_ROOT_PASSWORD,
  } = process.env;

  const host =
    global.__JEST_DISABLE_DB !== true ? MYSQL_HOST : 'jest-db-disabled';
  const port = _getDbPort(MYSQL_PORT);
  const username = MYSQL_USER || 'root';
  const password = MYSQL_PASSWORD ?? MYSQL_ROOT_PASSWORD;

  let result: CredentialOptions = {
    host,
    port,
    username,
    password,
  };

  if (dbName) {
    result = {
      ...result,
      database: dbName,
    };
  }

  return result;
}

function _makeReplicatedDbConfigParams(
  totalReplicaNodes: number,
  dbName?: string,
): ReplicationConnectionCredentialsOptions {
  const replicas: CredentialOptions[] = _getSingleDbConfigParams(
    totalReplicaNodes,
    dbName,
  );

  return {
    replication: {
      master: _makeSingleDbConfigParams(dbName),
      slaves: replicas,
      selector: 'RR',
    },
  };
}

function _getSingleDbConfigParams(
  totalReplicaNodes: number,
  dbName?: string,
): CredentialOptions[] {
  const replicas: CredentialOptions[] = [];

  for (let i = 1; i <= totalReplicaNodes; i++) {
    const host = process.env[`MYSQL_REPLICA_HOST_${i}`];
    const port = _getDbPort(process.env[`MYSQL_REPLICA_PORT_${i}`]);
    const username = process.env[`MYSQL_REPLICA_USERNAME_${i}`];
    const password = process.env[`MYSQL_REPLICA_PASSWORD_${i}`];
    let credentialsOptions: CredentialOptions = {
      host,
      port,
      username,
      password,
    };

    if (dbName) {
      credentialsOptions = {
        ...credentialsOptions,
        database: dbName,
      };
    }

    replicas.push(credentialsOptions);
  }

  return replicas;
}

function _getDbPort(port?: string): number {
  return port ? parseInt(port, 10) : 3306;
}
