/* istanbul ignore file */

import { Injectable, LoggerService, Provider } from '@nestjs/common';
import { Connection, ConnectionOptions } from 'typeorm';
import { getDBNameByConnection } from './conn.helper';
import * as Engine from 'typeorm-model-generator/dist/src/Engine';
import { getDefaultConnectionOptions } from 'typeorm-model-generator/dist/src/IConnectionOptions';
import { getDefaultGenerationOptions } from 'typeorm-model-generator/dist/src/IGenerationOptions';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import IConnectionOptions from 'typeorm-model-generator/dist/src/IConnectionOptions';

/**
 * Application service
 */
@Injectable()
export class DbOpsService {
  constructor(
    _options: any,
    private loggerService: LoggerService,
    private dbConnections: { conn: Connection; dbName: string }[],
  ) {}

  public async closeAllConnections() {
    for (const v of this.dbConnections) {
      if (v.conn.isConnected) await v.conn.close();
    }
  }

  public async create() {
    for (const v of this.dbConnections) {
      const queryRunner = v.conn.createQueryRunner();
      this.loggerService.log('Creating ' + v.dbName);
      await queryRunner.createDatabase(v.dbName, true);
    }
  }

  public async sync(throwOnError = false, dropTables = false) {
    this.loggerService.debug?.('Synchronizing db...');
    for (const v of this.dbConnections) {
      this.loggerService.debug?.(`Synchronizing ${v.dbName}...`);
      try {
        await v.conn.synchronize(dropTables);
      } catch (e) {
        if (throwOnError) {
          throw e;
        } else {
          this.loggerService.debug?.(`${v.dbName} not Synchronized`);
        }
      }
    }

    this.loggerService.debug?.('Synchronze completed!');
  }

  public async drop() {
    for (const v of this.dbConnections) {
      const queryRunner = v.conn.createQueryRunner();
      this.loggerService.debug?.(`Dropping ${v.dbName}`);
      await queryRunner.dropDatabase(v.dbName, true);
    }
  }

  public async migrate() {
    this.loggerService.debug?.('Migrating db...');

    for (const v of this.dbConnections) {
      await v.conn.runMigrations({
        transaction: 'all',
      });
    }

    this.loggerService.debug?.('Migration completed!');
  }

  public async generate(dbName: string, tables: string[], genPath?: string) {
    this.loggerService.debug?.('Exporting db to TypeORM entities...');

    const driver = Engine.createDriver('mysql');

    const mysqlConnectionOptions: MysqlConnectionOptions[] = [];
    this.dbConnections.forEach(({ conn: { options } }) => {
      if (isMysqlConnectionOption(options) && dbName === options.database) {
        mysqlConnectionOptions.push(options);
      }
    });

    if (!mysqlConnectionOptions.length) {
      this.loggerService.error(
        `There is no MySQL database connection configured for ${dbName}. ` +
          'Please refer to the documentation for Database Connection Setup',
      );
      return;
    }

    for (const options of mysqlConnectionOptions) {
      const connOptions: IConnectionOptions = {
        ...getDefaultConnectionOptions(),
        host: options.host ?? '127.0.0.1',
        port: options.port ?? 3306,
        password: options.password ?? '',
        user: options.username ?? '',
        databaseNames: options.database ? [options.database] : [],
        databaseType: options.type,
        onlyTables: tables,
      };

      const generationOptions = {
        ...getDefaultGenerationOptions(),
      };

      if (genPath) {
        generationOptions.resultsPath = genPath;
      }

      generationOptions.resultsPath += `/${dbName}`;

      await Engine.createModelFromDatabase(
        driver,
        connOptions,
        generationOptions,
      );
    }

    this.loggerService.debug?.('Export complete!');
  }
}

export function isMysqlConnectionOption(
  options: ConnectionOptions | MysqlConnectionOptions,
): options is MysqlConnectionOptions {
  return (options as ConnectionOptions).type === 'mysql';
}

export const dbConnectionMap = (c: Connection) => ({
  conn: c,
  dbName: c.options.database?.toString() ?? getDBNameByConnection(c.name),
});

export const DbObpsServiceFactory = (
  loggerService: string,
  connectionTokens: any[],
): Provider => ({
  provide: DbOpsService,
  useFactory: async (
    loggerService: LoggerService,
    ...dbConnections: Connection[]
  ) => {
    return new DbOpsService(
      {},
      loggerService,
      dbConnections.map(dbConnectionMap),
    );
  },
  inject: [loggerService, ...connectionTokens],
});
