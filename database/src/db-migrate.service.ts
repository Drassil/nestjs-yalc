/* istanbul ignore file */

import { Injectable, Provider } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import {
  CannotExecuteNotConnectedError,
  DataSource,
  MigrationExecutor,
} from 'typeorm';
import { dbConnectionMap } from './conn.helper.js';

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
export class DbMigrateService {
  constructor(
    private loggerService: LoggerService,
    private dbConnections: { conn: DataSource; dbName: string }[],
  ) {}

  public async migrate(options?: MigrationOptions) {
    this.loggerService.debug?.('Migrating db...');

    if (options?.selMigrations) {
      this.loggerService.debug?.(
        `Selected migrations ${JSON.stringify(options.selMigrations)}`,
      );
    }

    for (const v of this.dbConnections) {
      if (!v.conn.isInitialized)
        throw new CannotExecuteNotConnectedError(v.conn.name);

      const queryRunner = v.conn.createQueryRunner();

      const migrationExecutor = new MigrationExecutor(v.conn, queryRunner);
      migrationExecutor.transaction = 'all';

      const migrations = await migrationExecutor.getAllMigrations();

      const dbName = v.conn.driver.database ?? v.dbName;

      // if there are no migrations, then do not execute anything!
      if (!Array.isArray(migrations) || migrations.length <= 0) {
        this.loggerService.debug?.(`No migrations available on ${dbName}`);
        continue;
      }

      if (options?.selMigrations) {
        this.loggerService.debug?.(
          `Executing selected migrations on ${dbName}`,
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
              `Executing migration ${migration.name} for ${dbName}`,
            );
            await migrationExecutor.executeMigration(migration);
          }
        }
      } else {
        this.loggerService.debug?.(`Executing migration for ${dbName}`);
        await migrationExecutor.executePendingMigrations();
      }
    }

    this.loggerService.debug?.('Migration completed!');
  }
}

export const DbMigrationServiceFactory = (
  loggerServiceToken: string,
  connectionTokens: any[],
): Provider => ({
  provide: DbMigrateService,
  useFactory: async (
    loggerService: LoggerService,
    ...dbConnections: DataSource[]
  ) => {
    return new DbMigrateService(
      loggerService,
      dbConnections.map(dbConnectionMap),
    );
  },
  inject: [loggerServiceToken, ...connectionTokens],
});
