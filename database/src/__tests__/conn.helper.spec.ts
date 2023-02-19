import { createMock } from '@golevelup/ts-jest';
import {
  expect,
  jest,
  describe,
  it,
  beforeEach,
  beforeAll,
  afterAll,
  afterEach,
} from '@jest/globals';
import { DataSource } from 'typeorm';
import {
  getConfNameByConnection,
  getConnectionName,
  DBCONF_PREFIX,
  getDBNameByConnection,
  dbConnectionMap,
} from '../conn.helper.js';

describe('conn.helper test', () => {
  it('should test getConfNameByConnection', async () => {
    const res = getConfNameByConnection('testConnection');
    expect(res).toBe(`${DBCONF_PREFIX}testConnection`);
  });

  it('should test getConnectionName', async () => {
    const res = getConnectionName('test');
    expect(res).toBe(`testConnection`);
  });

  it('should test getDBNameByConnection', async () => {
    const res = getDBNameByConnection('testConnection');
    expect(res).toBe(`test`);
  });

  it('should test dbConnectionMap with connectionName', async () => {
    const mockedDataSource = createMock<DataSource>({
      name: 'testConnection',
    });
    const res = dbConnectionMap(mockedDataSource);
    expect(res.dbName).toBe(`test`);
  });
});
