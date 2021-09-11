import {
  getConfNameByConnection,
  getConnectionName,
  DBCONF_PREFIX,
  getDBNameByConnection,
} from '../conn.helper';

describe('conn.helper test', () => {
  it('Check getConfNameByConnection', async () => {
    const res = getConfNameByConnection('testConnection');
    expect(res).toBe(`${DBCONF_PREFIX}testConnection`);
  });

  it('Check getConnectionName', async () => {
    const res = getConnectionName('test');
    expect(res).toBe(`testConnection`);
  });

  it('Check getDBNameByConnection', async () => {
    const res = getDBNameByConnection('testConnection');
    expect(res).toBe(`test`);
  });
});
