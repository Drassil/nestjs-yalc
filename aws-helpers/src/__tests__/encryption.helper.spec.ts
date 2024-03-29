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
        getParameter: () => ({ promise: mockSSMGetParameter }),
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
    mockSSMGetParameter.mockReturnValue({
      Parameter: { Value: 'ssmDecrypted' },
    });

    const result = await $.decryptSsmVariable('toDecrypt');
    expect(result).toBe('ssmDecrypted');
  });

  it('should handle SSM variable decryption with cache without value', async () => {
    mockSSMGetParameter.mockReturnValue({
      Parameter: null,
    });

    const result = await $.decryptSsmVariable('toDecrypt', true);
    expect(result).toBe('ssmDecrypted');
  });

  it('should handle SSM variable decryption with cache with empty value', async () => {
    mockSSMGetParameter.mockReturnValue({
      Parameter: {},
    });

    const result = await $.decryptSsmVariable('toDecryptNoValue');
    expect(result).toBe('');
  });

  it('should handle SSM variable decryption with cache with empty value...again', async () => {
    mockSSMGetParameter.mockReturnValue({
      Parameter: {},
    });

    const result = await $.decryptSsmVariable('toDecryptNoValue');
    expect(result).toBe('');
  });

  it('should handle SSM variable decryption error', async () => {
    mockSSMGetParameter.mockImplementation(() => {
      throw new Error('SSM Error');
    });

    const result = await $.decryptSsmVariable('toDecrypt', false);
    expect(result).toBe('');
  });

  it('should set environment variables from SSM', async () => {
    mockSSMGetParameter.mockReturnValue({
      Parameter: { Value: 'ssmDecrypted' },
    });

    const envVars = { TEST_VAR: 'ssmVar' };
    const result = await $.setEnvironmentVariablesFromSsm(envVars, false);
    expect(result).toEqual({ TEST_VAR: 'ssmDecrypted' });
    expect(process.env.TEST_VAR).toBe('ssmDecrypted');
  });

  it('should set environment variables from SSM with cache', async () => {
    mockSSMGetParameter.mockReturnValue({
      Parameter: { Value: 'ssmDecrypted' },
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

  it('should handle concurrent SSM variable decryption with cache', async () => {
    mockSSMGetParameter.mockReset();
    // Mock SSM getParameter to return a promise that resolves after 100ms
    mockSSMGetParameter.mockReturnValue(
      new Promise((resolve) =>
        setTimeout(
          () => resolve({ Parameter: { Value: 'ssmDecrypted' } }),
          100,
        ),
      ),
    );

    // Make concurrent calls to decryptSsmVariable
    const promises = Array(5)
      .fill(null)
      .map(() => $.decryptSsmVariable('concurrentDecrypt', true));

    // Wait for all promises to resolve
    const results = await Promise.all(promises);

    // Check that all promises resolved to the same value
    expect(results).toEqual(Array(5).fill('ssmDecrypted'));

    // Check that SSM getParameter was called only once
    expect(mockSSMGetParameter).toHaveBeenCalledTimes(1);
  });
});
