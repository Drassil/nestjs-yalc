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
import {
  isJsonSQLRaw,
  JsonField,
  NYALC_JSON_FIELD_META_KEY,
} from '../json.helpers.js';
import 'reflect-metadata';

describe('JsonHelpers test', () => {
  it('isJsonSQLRaw should work', () => {
    let result = isJsonSQLRaw('->$.');

    expect(result).toEqual(true);

    result = isJsonSQLRaw('->&.');

    expect(result).toEqual(false);
  });

  it('JsonField should work', () => {
    const resultFn = JsonField();
    const spiedDefineMetadata = jest.spyOn(Reflect, 'defineMetadata');
    resultFn({ something: 'something' }, 'keyName');

    expect(spiedDefineMetadata).toHaveBeenCalledWith(
      NYALC_JSON_FIELD_META_KEY,
      { keyName: true },
      { something: 'something' },
    );
  });
});
