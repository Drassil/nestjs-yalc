import { envTestHelper } from '@nestjs-yalc/jest/env.helper';
import { CONN_SUFFIX } from '../conn.helper';
import { buildDbConfigObject } from '../db-config-object.helper';

describe('buildDbConfigObject()', () => {
  const env = envTestHelper();
  const OLD_JEST_DISABLE_DB = global.__JEST_DISABLE_DB;

  afterEach(() => {
    env.reset();
    global.__JEST_DISABLE_DB = OLD_JEST_DISABLE_DB;
  });

  it('should return default config', () => {
    const {
      name,
      database,
      entities,
      seeds,
      factories,
      migrations,
      cli,
    } = buildDbConfigObject({
      dbName: 'DB_TEST_NAME',
      entities: ['ENTITY_TEST'],
    })();

    expect(name).toBe(`DB_TEST_NAME${CONN_SUFFIX}`);
    expect(database).toBe('DB_TEST_NAME');
    expect(entities).toStrictEqual(['ENTITY_TEST']);
    expect(seeds).toBe(undefined);
    expect(factories).toBe(undefined);
    expect(migrations).toBe(undefined);
    expect(cli).toEqual({
      migrationsDir: undefined,
    });
  });

  it('should set database config when optional values were provided', () => {
    const {
      name,
      database,
      entities,
      seeds,
      factories,
      migrations,
      cli,
    } = buildDbConfigObject({
      dbName: 'DB_TEST_NAME',
      entities: ['ENTITY_TEST'],
      sourceDir: 'TEST_SOURCE_DIR',
      migrationsDir: 'TEST_MIGRATIONS_DIR',
      connectionName: 'CONNECTION_TEST',
    })();

    expect(name).toBe(`CONNECTION_TEST${CONN_SUFFIX}`);
    expect(database).toBe('DB_TEST_NAME');
    expect(entities).toStrictEqual(['ENTITY_TEST']);
    expect(seeds).toBe(undefined);
    expect(factories).toStrictEqual([`TEST_SOURCE_DIR/**/*.factory.{ts,js}`]);
    expect(migrations).toStrictEqual([`TEST_MIGRATIONS_DIR/**/*.{ts,js}`]);
    expect(cli).toEqual({
      migrationsDir: 'TEST_MIGRATIONS_DIR',
    });
  });

  it('should remove database and entities for the CLI', () => {
    env.build({ TYPEORM_NO_SEL_DB: 'true' });

    const dbConfig = buildDbConfigObject({
      dbName: 'DB_TEST_NAME',
      entities: ['TEST_ENTITY'],
      sourceDir: 'TEST_SOURCE_DIR',
      migrationsDir: 'TEST_MIGRATIONS_DIR',
      connectionName: 'CONNECTION_TEST',
    })();

    expect(dbConfig.database).toBe(undefined);
    expect(dbConfig.entities).toBe(undefined);
  });
});

describe('getDefaultDbConnectionConfig for single or replicas db', () => {
  const env = envTestHelper();
  const OLD_JEST_DISABLE_DB = global.__JEST_DISABLE_DB;

  afterEach(() => {
    env.reset();
    global.__JEST_DISABLE_DB = OLD_JEST_DISABLE_DB;
  });

  it('should return the default configuration for a single database', () => {
    env.build({
      MYSQL_HOST: 'HOST_TEST',
      MYSQL_PORT: '123',
      MYSQL_USER: 'USER_TEST',
      MYSQL_PASSWORD: 'PWD_TEST',
    });

    global.__JEST_DISABLE_DB = false;

    const {
      database,
      extra,
      host,
      logging,
      password,
      port,
      synchronize,
      type,
      username,
    } = buildDbConfigObject({
      dbName: 'TEST_REPLICATION_DATABASE_NAME',
      entities: [],
    })();

    expect(database).toBe('TEST_REPLICATION_DATABASE_NAME');
    expect(extra).toEqual({
      decimalNumbers: true,
    });
    expect(host).toBe('HOST_TEST');
    expect(logging).toBe(false);
    expect(password).toBe('PWD_TEST');
    expect(port).toBe(123);
    expect(synchronize).toBe(false);
    expect(type).toBe('mysql');
    expect(username).toBe('USER_TEST');
  });

  it('should return a valid configuration object for replication', () => {
    env.build({
      MYSQL_HOST: 'HOST_TEST',
      MYSQL_PORT: '123',
      MYSQL_USER: 'USER_TEST',
      MYSQL_PASSWORD: 'PWD_TEST',
      MYSQL_ROOT_PASSWORD: 'ROOT_PWD_TEST',
      MYSQL_TOTAL_REPLICATION_NODES: '1',
      MYSQL_REPLICA_HOST_1: 'REPLICA_HOST_TEST',
      MYSQL_REPLICA_PORT_1: '456',
      MYSQL_REPLICA_USERNAME_1: 'REPLICA_USERNAME_TEST',
      MYSQL_REPLICA_PASSWORD_1: 'REPLICA_PWD_TEST',
    });

    global.__JEST_DISABLE_DB = false;

    const result = buildDbConfigObject({
      dbName: 'TEST_REPLICATION_DATABASE_NAME',
      entities: [],
    })();

    expect(result.replication).toEqual({
      master: {
        database: 'TEST_REPLICATION_DATABASE_NAME',
        host: 'HOST_TEST',
        password: 'PWD_TEST',
        port: 123,
        username: 'USER_TEST',
      },
      selector: 'RR',
      slaves: [
        {
          database: 'TEST_REPLICATION_DATABASE_NAME',
          host: 'REPLICA_HOST_TEST',
          password: 'REPLICA_PWD_TEST',
          port: 456,
          username: 'REPLICA_USERNAME_TEST',
        },
      ],
    });
  });

  it('should set defaults when optional env vars are missing', () => {
    env.build({
      MYSQL_HOST: 'HOST_TEST',
      MYSQL_ROOT_PASSWORD: 'ROOT_PWD_TEST',
    });

    const { host, port, username, password } = buildDbConfigObject({
      dbName: 'TEST_DB_NAME',
      entities: [],
    })();

    expect(host).toBe('jest-db-disabled');
    expect(port).toBe(3306);
    expect(username).toBe('root');
    expect(password).toBe('ROOT_PWD_TEST');
  });

  it('should set default db port as 3306 for db replica instances', () => {
    env.build({
      MYSQL_HOST: 'HOST_TEST',
      MYSQL_USER: 'USER_TEST',
      MYSQL_PASSWORD: 'PWD_TEST',
      MYSQL_ROOT_PASSWORD: 'ROOT_PWD_TEST',
      MYSQL_TOTAL_REPLICATION_NODES: '1',
      MYSQL_REPLICA_HOST_1: 'REPLICA_HOST_TEST',
      MYSQL_REPLICA_USERNAME_1: 'REPLICA_USERNAME_TEST',
      MYSQL_REPLICA_PASSWORD_1: 'REPLICA_PWD_TEST',
    });

    const result = buildDbConfigObject({
      dbName: 'TEST_DB_NAME',
      entities: [],
    })();

    expect(result.replication.master.port).toBe(3306);
    expect(result.replication.slaves[0].port).toBe(3306);
  });

  it("should not have a database key when dbName isn't provided", () => {
    const result = buildDbConfigObject({
      dbName: undefined,
      connectionName: 'name',
      entities: [],
    })();

    expect(result.database).toBe(undefined);
  });

  it("should not set up slave database key when dbName isn't provided", () => {
    env.build({
      MYSQL_TOTAL_REPLICATION_NODES: '1',
    });

    const result = buildDbConfigObject({
      dbName: undefined,
      connectionName: 'name',
      entities: [],
    })();

    expect(result.replication.slaves[0].database).toBe(undefined);
  });

  it("should throw an error when dbName and connectionName aren't provided", async () => {
    try {
      buildDbConfigObject({
        dbName: undefined,
        entities: [],
      });
    } catch (error) {
      expect(error).toEqual(
        new Error(
          'Cannot create a connection without a name, provide at least a dbName or connectionName',
        ),
      );
    }
  });
});
