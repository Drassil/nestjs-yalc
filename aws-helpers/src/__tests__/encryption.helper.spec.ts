import { DeepMocked, createMock } from '@golevelup/ts-jest';
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
import { importMockedEsm } from '@nestjs-yalc/jest/esm.helper.js';

jest.mock('aws-sdk');

import AWS from 'aws-sdk';
const localEncryption = (await importMockedEsm(
  '@nestjs-yalc/utils/encryption.helper.js',
  import.meta,
)) as DeepMocked<typeof import('@nestjs-yalc/utils/encryption.helper.js')>;
const $ = await import('../encryption.helper.js');

var mockKMSDecrypt: jest.Mock;
var mockKMSEncrypt: jest.Mock;
var mockSSMGetParameter: jest.Mock;

jest.mock('aws-sdk', () => {
  mockKMSDecrypt = jest.fn();
  mockKMSEncrypt = jest.fn();
  mockSSMGetParameter = jest.fn();

  return {
    KMS: jest.fn(() =>
      createMock<AWS.KMS>({
        decrypt: mockKMSDecrypt as any,
        encrypt: mockKMSEncrypt as any,
      }),
    ),
    SSM: jest.fn(() =>
      createMock<AWS.SSM>({
        getParameter: mockSSMGetParameter as any,
      }),
    ),
  };
});

// Please let me know if you know how to solve this as unknown as void.
describe('Encryption/Decryption Module', () => {
  beforeEach(() => {
    process.env.AWS_REMOTE_KEYID = 'SomeRemoteKeyWeHaveStoredExternally';
    process.env.NODE_ENV = 'production';
  });

  // Your test cases go here
  it('should decrypt using AWS', async () => {
    mockKMSDecrypt.mockImplementation((params, callback) => {
      callback(null, { Plaintext: 'decrypted' });
    });

    const result = await $.decryptString('toDecrypt', $.EncryptMode.AWS);
    expect(result).toBe('decrypted');
  });

  it('should handle AWS decryption error', async () => {
    mockKMSDecrypt.mockImplementation((params, callback) => {
      callback(new Error('AWS Error'), null);
    });

    await expect(
      $.decryptString('toDecrypt', $.EncryptMode.AWS),
    ).rejects.toThrow('AWS Error');
  });

  it('should decrypt using LOCAL', async () => {
    jest.spyOn(localEncryption, 'decryptAes').mockReturnValue('localDecrypted');
    const result = await $.decryptString('toDecrypt', $.EncryptMode.LOCAL);
    expect(result).toBe('localDecrypted');
  });

  it('should encrypt using AWS', async () => {
    const encryptionResult = Buffer.from('encrypted');
    mockKMSEncrypt.mockImplementation((params, callback) => {
      callback(null, { CiphertextBlob: encryptionResult });
    });

    const result = await $.encryptString('toEncrypt', $.EncryptMode.AWS);
    expect(result).toBe(encryptionResult.toString('base64'));
  });

  it('should handle AWS encryption error', async () => {
    mockKMSEncrypt.mockImplementation((params, callback) => {
      callback(new Error('AWS Error'), null);
    });

    await expect(
      $.encryptString('toEncrypt', $.EncryptMode.AWS),
    ).rejects.toThrow('AWS Error');
  });

  it('should encrypt using LOCAL', async () => {
    jest.spyOn(localEncryption, 'encryptAes').mockReturnValue('localEncrypted');
    const result = await $.encryptString('toEncrypt', $.EncryptMode.LOCAL);
    expect(result).toBe('localEncrypted');
  });

  it('should handle SSM variable decryption with cache', async () => {
    mockSSMGetParameter.mockImplementation((params, callback) => {
      callback(null, { Parameter: { Value: 'ssmDecrypted' } });
    });

    const result = await $.decryptSsmVariable('toDecrypt', true);
    expect(result).toBe('ssmDecrypted');
  });

  it('should handle SSM variable decryption with cache', async () => {
    mockSSMGetParameter.mockImplementation((params, callback) => {
      callback(null, { Parameter: { Value: 'test' } });
    });

    const result = await $.decryptSsmVariable('toDecrypt', true);
    expect(result).toBe('ssmDecrypted');
  });

  it('should handle SSM variable decryption error', async () => {
    mockSSMGetParameter.mockImplementation((params, callback) => {
      callback(new Error('SSM Error'), null);
    });

    const result = await $.decryptSsmVariable('toDecrypt', false);
    expect(result).toBe('');
  });

  it('should set environment variables from SSM', async () => {
    mockSSMGetParameter.mockImplementation((params, callback) => {
      callback(null, { Parameter: { Value: 'ssmDecrypted' } });
    });

    const envVars = { TEST_VAR: 'ssmVar' };
    const result = await $.setEnvironmentVariablesFromSsm(envVars);
    expect(result).toEqual({ TEST_VAR: 'ssmDecrypted' });
    expect(process.env.TEST_VAR).toBe('ssmDecrypted');
  });

  it('should throw error if AWS_REMOTE_KEYID is undefined in asyncEncrypt', async () => {
    delete process.env.AWS_REMOTE_KEYID;
    await expect($.asyncEncrypt('toEncrypt')).rejects.toThrow(
      'Calling kms encrypt function without setting the AWS_REMOTE_KEYID variable',
    );
  });

  it('should handle decryptCallback success', () => {
    const resolve = jest.fn();
    const reject = jest.fn();
    const callback = $.decryptCallback(resolve, reject);

    callback(null, { Plaintext: 'decrypted' });
    expect(resolve).toHaveBeenCalledWith('decrypted');
    expect(reject).not.toHaveBeenCalled();
  });

  it('should handle decryptCallback error', () => {
    const resolve = jest.fn();
    const reject = jest.fn();
    const callback = $.decryptCallback(resolve, reject);

    callback(new Error('Some error'), null);
    expect(reject).toHaveBeenCalledWith(new Error('Some error'));
    expect(resolve).not.toHaveBeenCalled();
  });

  it('should handle decryptCallback with undefined Plaintext', () => {
    const resolve = jest.fn();
    const reject = jest.fn();
    const callback = $.decryptCallback(resolve, reject);

    callback(null, {});
    expect(resolve).toHaveBeenCalledWith('');
    expect(reject).not.toHaveBeenCalled();
  });

  it('should handle undefined CiphertextBlob in asyncEncrypt', async () => {
    mockKMSEncrypt.mockImplementation((params, callback) => {
      callback(null, { CiphertextBlob: undefined });
    });

    const result = $.asyncEncrypt('toEncrypt');

    await expect(result).rejects.toEqual(
      'Error CiphertextBlob coming from kms encrypt is undefined',
    );
  });
});
