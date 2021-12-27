/* istanbul ignore file */

import { Injectable, LoggerService, Provider } from "@nestjs/common";
import {
  CannotExecuteNotConnectedError,
  Connection,
  ConnectionOptions,
  MigrationExecutor,
} from "typeorm";
import { getDBNameByConnection } from "./conn.helper";
import * as Engine from "typeorm-model-generator/dist/src/Engine";
import { getDefaultConnectionOptions } from "typeorm-model-generator/dist/src/IConnectionOptions";
import { getDefaultGenerationOptions } from "typeorm-model-generator/dist/src/IGenerationOptions";
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";
import IConnectionOptions from "typeorm-model-generator/dist/src/IConnectionOptions";

export type MigrationSelection = { [database: string]: string[] };

export interface MigrationOptions {
  /**
   * An object to define migrations to explicitly select
   * it's composed by:
   * property name -> name of the database
   * property value -> array of migration class names to skip
   */
  selMigrations?: MigrationSelection;
}

/**
 * Application service
 */
@Injectable()
export class DbOpsService {
  constructor(
    _options: any,
    private loggerService: LoggerService,
    private dbConnections: { conn: Connection; dbName: string }[]
  ) {}

  public async closeAllConnections() {
    for (const v of this.dbConnections) {
      if (v.conn.isConnected) await v.conn.close();
    }
  }

  public async create() {
    for (const v of this.dbConnections) {
      const queryRunner = v.conn.createQueryRunner();
      this.loggerService.log("Creating " + v.dbName);
      await queryRunner.createDatabase(v.dbName, true);
    }
  }

  public async sync(throwOnError = false, dropTables = false) {
    this.loggerService.debug?.("Synchronizing db...");
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

    this.loggerService.debug?.("Synchronze completed!");
  }

  public async drop() {
    for (const v of this.dbConnections) {
      const queryRunner = v.conn.createQueryRunner();
      this.loggerService.debug?.(`Dropping ${v.dbName}`);
      await queryRunner.dropDatabase(v.dbName, true);
    }
  }

  public async migrate(options?: MigrationOptions) {
    this.loggerService.debug?.("Migrating db...");

    for (const v of this.dbConnections) {
      if (!v.conn.isConnected)
        throw new CannotExecuteNotConnectedError(v.conn.name);

      const queryRunner = v.conn.createQueryRunner();

      const migrationExecutor = new MigrationExecutor(v.conn, queryRunner);
      migrationExecutor.transaction = "all";

      const migrations = await migrationExecutor.getAllMigrations();

      const dbName = v.conn.driver.database;

      // if there are no migrations, then do not execute anything!
      if (!Array.isArray(migrations) || migrations.length <= 0) {
        this.loggerService.debug?.(`No migrations available on ${dbName}`);
        continue;
      }

      if (options && options.selMigrations) {
        this.loggerService.debug?.(
          `Executing selected migrations ${JSON.stringify(
            options.selMigrations
          )} for ${dbName}`
        );

        const pendingMigrations =
          await migrationExecutor.getPendingMigrations();

        const selectedMigrations = dbName
          ? options.selMigrations[dbName]
          : true; // execute all migrations when it's a connection without db specified

        for (const migration of pendingMigrations) {
          if (
            selectedMigrations === true ||
            (Array.isArray(selectedMigrations) &&
              selectedMigrations.includes(migration.name))
          ) {
            this.loggerService.debug?.(
              `Executing migration ${migration.name} for ${dbName}`
            );
            await migrationExecutor.executeMigration(migration);
          }
        }
      } else {
        this.loggerService.debug?.(`Executing migration for ${dbName}`);
        await migrationExecutor.executePendingMigrations();
      }
    }

    this.loggerService.debug?.("Migration completed!");
  }

  public async generate(dbName: string, tables: string[], genPath?: string) {
    this.loggerService.debug?.("Exporting db to TypeORM entities...");

    const driver = Engine.createDriver("mysql");

    const mysqlConnectionOptions: MysqlConnectionOptions[] = [];
    this.dbConnections.forEach(({ conn: { options } }) => {
      if (isMysqlConnectionOption(options) && dbName === options.database) {
        mysqlConnectionOptions.push(options);
      }
    });

    if (!mysqlConnectionOptions.length) {
      this.loggerService.error(
        `There is no MySQL database connection configured for ${dbName}. ` +
          "Please refer to the documentation for Database Connection Setup"
      );
      return;
    }

    for (const options of mysqlConnectionOptions) {
      const connOptions: IConnectionOptions = {
        ...getDefaultConnectionOptions(),
        host: options.host ?? "127.0.0.1",
        port: options.port ?? 3306,
        password: options.password ?? "",
        user: options.username ?? "",
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
        generationOptions
      );
    }

    this.loggerService.debug?.("Export complete!");
  }
}

export function isMysqlConnectionOption(
  options: ConnectionOptions | MysqlConnectionOptions
): options is MysqlConnectionOptions {
  return (options as ConnectionOptions).type === "mysql";
}

export const dbConnectionMap = (c: Connection) => ({
  conn: c,
  dbName: c.options.database?.toString() ?? getDBNameByConnection(c.name),
});

export const DbObpsServiceFactory = (
  loggerService: string,
  connectionTokens: any[]
): Provider => ({
  provide: DbOpsService,
  useFactory: async (
    loggerService: LoggerService,
    ...dbConnections: Connection[]
  ) => {
    return new DbOpsService(
      {},
      loggerService,
      dbConnections.map(dbConnectionMap)
    );
  },
  inject: [loggerService, ...connectionTokens],
});
