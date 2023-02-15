/* istanbul ignore file */

import { Injectable, Provider } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { DataSource, DataSourceOptions } from 'typeorm';
import { dbConnectionMap } from './conn.helper.js';
import * as Engine from 'typeorm-model-generator/dist/src/Engine.js';
import * as ConnOptions from 'typeorm-model-generator/dist/src/IConnectionOptions.js';
import { getDefaultGenerationOptions } from 'typeorm-model-generator/dist/src/IGenerationOptions.js';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions.js';
import { getDataSourceToken } from '@nestjs/typeorm';

type IConnectionOptions = ConnOptions.default;

/**
 * Application service
 */
@Injectable()
export class DbOpsService {
  constructor(
    _options: any,
    private loggerService: LoggerService,
    private dbConnections: { conn: DataSource; dbName: string }[],
  ) {}

  public async closeAllConnections() {
    for (const v of this.dbConnections) {
      if (v.conn.isInitialized) await v.conn.destroy();
    }
  }

  public async create() {
    for (const v of this.dbConnections) {
      const schemaName = v.dbName;
      if (!schemaName) {
        this.loggerService.log(`Schema name not defined for ${v.dbName}`);
        continue;
      }

      const queryRunner = v.conn.createQueryRunner();
      this.loggerService.log('Creating ' + schemaName);
      await queryRunner.createSchema(schemaName, true);
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
      await queryRunner.dropSchema(v.dbName, true, true);
    }
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
        ...ConnOptions.getDefaultConnectionOptions(),
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
  options: DataSourceOptions | MysqlConnectionOptions,
): options is MysqlConnectionOptions {
  return (options as DataSourceOptions).type === 'mysql';
}

export const DbOpsServiceFactory = (
  loggerServiceToken: string,
  connectionTokens: any[],
): Provider => ({
  provide: DbOpsService,
  useFactory: async (
    loggerService: LoggerService,
    ...dbConnections: DataSource[]
  ) => {
    return new DbOpsService(
      {},
      loggerService,
      dbConnections.map(dbConnectionMap),
    );
  },
  inject: [loggerServiceToken, ...connectionTokens.map(getDataSourceToken)],
});
