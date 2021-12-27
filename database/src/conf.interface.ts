import { Seeder } from "typeorm-seeding";
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";

export interface IDbConfType extends MysqlConnectionOptions {
  factories?: string[];
  seeds?: { new (): Seeder }[];
}

export interface IDbConfObject {
  (): IDbConfType;
  connName: string;
  dbName: string;
}
