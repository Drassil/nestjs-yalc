import { DataSource } from 'typeorm';

export const DBCONF_PREFIX = 'dbConf_';
export const CONN_SUFFIX = 'Connection';

export function getConfNameByConnection(connName: string) {
  return `${DBCONF_PREFIX}${connName}`;
}

export function getConnectionName(dbName: string) {
  return `${dbName}${CONN_SUFFIX}`;
}

export function getDBNameByConnection(connName: string) {
  return connName.substring(0, connName.indexOf(CONN_SUFFIX));
}

export const dbConnectionMap = (c: DataSource) => ({
  conn: c,
  dbName:
    c.options.database?.toString() ??
    c.driver.schema ??
    getDBNameByConnection(c.name),
});
