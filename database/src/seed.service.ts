/* istanbul ignore file */

import { factory, useSeeding } from "typeorm-seeding";
import { ConfigureOption } from "typeorm-seeding/dist/connection";
import { Injectable, LoggerService, Provider } from "@nestjs/common";
import { Connection } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { IDbConfType } from "./conf.interface";
import { getConfNameByConnection } from "./conn.helper";

/**
 * Application service
 */
@Injectable()
export class SeedService {
  constructor(
    private dbConnections: Connection[],
    private loggerService: LoggerService,
    private configService: ConfigService,
    private configPath: string
  ) {}

  public async closeAllConnections() {
    for (const v of this.dbConnections) {
      if (v.isConnected) await v.close();
    }
  }

  private async seedDatabase(
    connection: Connection,
    name: string,
    reseed: boolean
  ) {
    const dbConf = this.configService.get<IDbConfType>(
      getConfNameByConnection(connection.name)
    );

    if (!dbConf?.seeds || dbConf?.seeds.length === 0) return;

    this.loggerService.debug?.(`Seeding: ${name}`);

    const option: ConfigureOption = {
      root: this.configPath,
      configName: "ormconfig",
      connection: connection.name,
    };

    this.resetConnection();

    if (reseed) {
      this.loggerService.debug?.(
        `Reseeding ${name} on connection: ${connection.name}...`
      );
      const queryRunner = connection.createQueryRunner();
      this.loggerService.debug?.("Clear tables");
      for (const meta of connection.entityMetadatas) {
        this.loggerService.debug?.(`Truncating ${meta.tableName}`);
        await queryRunner.clearTable(meta.tableName);
      }
      this.loggerService.debug?.("Database cleared!");
    }

    this.loggerService.debug?.("Use seeding");
    await useSeeding(option);

    this.setConnection(connection);

    const seeders = dbConf?.seeds;
    for (const seeder of seeders) {
      const label = `${seeder.name} execution time:`;
      // eslint-disable-next-line no-console
      console.time(label);
      this.loggerService.debug?.(`Running seeder ${seeder.name}`);
      await new seeder().run(factory, connection);
      // eslint-disable-next-line no-console
      console.timeEnd(label);
    }

    this.loggerService.debug?.(`Completed: ${name}`);
  }

  public async seedDatabases(reseed: boolean /*, _databases*/) {
    this.loggerService.debug?.("Seeding db...");

    for (const connection of this.dbConnections) {
      if (!connection.options.database) continue;
      await this.seedDatabase(
        connection,
        connection.options.database.toString(),
        reseed
      );
    }

    this.loggerService.debug?.("Seeding completed!");
  }

  /**
   *  Use it to reset connection options to be able to change database connection
   *
   */
  private resetConnection() {
    global["TypeORM_Seeding_Connection"] = {
      configureOption: {
        root: process.cwd(),
        configName: "",
        connection: "",
      },
      ormConfig: undefined,
      connection: undefined,
      overrideConnectionOptions: {},
    };
  }

  private setConnection(connection: Connection | undefined) {
    global["TypeORM_Seeding_Connection"]["connection"] = connection;
  }
}

export const SeedServiceFactory = (
  configPath: string,
  loggerService: string,
  connectionTokens: any[]
): Provider => ({
  provide: SeedService,
  useFactory: async (
    configService: ConfigService,
    loggerService: LoggerService,
    ...dbConnections: Connection[]
  ) => {
    return new SeedService(
      dbConnections,
      loggerService,
      configService,
      configPath
    );
  },
  inject: [ConfigService, loggerService, ...connectionTokens],
});
