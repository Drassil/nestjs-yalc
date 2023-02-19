import {
  describe,
  expect,
  it,
  jest,
  beforeAll,
  beforeEach,
  test,
} from '@jest/globals';

import { encryptAes, decryptAes } from '../encryption.helper.js';
import crypto from 'crypto';

// Please let me know if you know how to solve this as unknown as void.
jest
  .spyOn(crypto, 'randomBytes')
  .mockReturnValue(
    Buffer.from('173606b5fe22770c890b48c41866abc3', 'hex') as unknown as void,
  );

describe('Utils encryption helper test', () => {
  const key =
    '60f810732e3c8d1eb5ba227143d46aabce1bb1ae0aa7081ef0b0c3bbaaed76a6';
  const decrypted = 'should be able to encrypt a simple message with a key';
  it('should be defined', () => {
    expect(encryptAes).toBeDefined();
  });

  it('should be defined', () => {
    expect(decryptAes).toBeDefined();
  });

  it('should be able to encrypt a simple message with a key', () => {
    expect(encryptAes(decrypted, key)).toBeDefined();
  });

  it('should be able to decrypt a simple message with a key', () => {
    const encrypted = encryptAes(decrypted, key);
    expect(decryptAes(encrypted, key)).toEqual(decrypted);
  });

  it('should return an empty string if the input is empty as well', () => {
    expect(decryptAes('', key)).toEqual('');
  });
});
