jest.mock('aws-sdk');

import { createMock } from '@golevelup/ts-jest';
import * as $ from './encryption.helper';
import * as AWS from 'aws-sdk';
import * as crypto from 'crypto';

// Please let me know if you know how to solve this as unknown as void.
jest
  .spyOn(crypto, 'randomBytes')
  .mockReturnValue(
    (Buffer.from('173606b5fe22770c890b48c41866abc3', 'hex') as unknown) as void,
  );

jest.mock('aws-sdk', () => {
  type decryptType = typeof AWS.KMS.prototype.decrypt;
  type encryptType = typeof AWS.KMS.prototype.encrypt;

  const mockedKMS = createMock<AWS.KMS>();
  mockedKMS.encrypt.mockImplementationOnce(((param: any, callback: any) => {
    callback(null, {
      CiphertextBlob: 'should be able to decrypt simply locally',
    });
  }) as encryptType);
  mockedKMS.encrypt.mockImplementationOnce(((param: any, callback: any) => {
    callback('some error message');
  }) as encryptType);
  mockedKMS.encrypt.mockImplementationOnce(((param: any, callback: any) => {
    callback(null, {});
  }) as encryptType);

  mockedKMS.decrypt.mockImplementation(((param: any, callback: any) => {
    callback(null, {});
  }) as decryptType);

  return {
    KMS: jest.fn(() => mockedKMS),
  };
});

beforeAll(async (done) => {
  //get requires env vars
  done();
});

describe('Encryption helper test', () => {
  const encryptionKey =
    '60f810732e3c8d1eb5ba227143d46aabce1bb1ae0aa7081ef0b0c3bbaaed76a6';
  const encrypted =
    '173606b5fe22770c890b48c41866abc3:3d34fcfb20bc5aae0e821c721449af6b9a58dbbd1596719e919a25e35ed52fb0d74f62ff8b7b24b6';
  const tempStage = process.env.NODE_ENV;

  afterEach(() => {
    delete process.env.IS_AWS_ENV;
    delete process.env.AWS_REMOTE_KEYID;
    process.env.NODE_ENV = tempStage;
  });

  it('should be defined', () => {
    expect($.decryptString).toBeDefined();
  });

  it('should be able to decrypt simply locally', async () => {
    const toEncrypt = 'should be able to decrypt simply locally';
    const decoded = await $.decryptString(encrypted, encryptionKey);
    expect(decoded).toEqual(toEncrypt);
  });

  it('should be able to encrypt simply locally', async () => {
    const toEncrypt = 'should be able to decrypt simply locally'; // use same string, even though message is strange
    const encoded = await $.encryptString(toEncrypt, encryptionKey);
    expect(encoded).toEqual(encrypted);
  });

  it('should be able to encrypt remotely', async () => {
    process.env.IS_AWS_ENV = 'true';
    process.env.AWS_REMOTE_KEYID = 'SomeRemoteKeyWeHaveStoredExternally';
    process.env.NODE_ENV = 'production';
    const toEncrypt = 'should be able to decrypt simply locally'; // use same string, even though message is strange
    const encoded = await $.encryptString(toEncrypt);
    expect(encoded).toEqual(toEncrypt); // change toEncrypt to encrypted
  });

  it('should return an error when KMS returns error', async () => {
    try {
      process.env.IS_AWS_ENV = 'true';
      process.env.AWS_REMOTE_KEYID = 'SomeRemoteKeyWeHaveStoredExternally';
      process.env.NODE_ENV = 'production';
      const toEncrypt = 'should be able to decrypt simply locally'; // use same string, even though message is strange
      await $.encryptString(toEncrypt);
    } catch (error) {
      expect(error).toEqual('some error message');
    }
  });

  it('should return an error when KMS returns object which is missing CiphertextBlob', async () => {
    try {
      process.env.IS_AWS_ENV = 'true';
      process.env.AWS_REMOTE_KEYID = 'SomeRemoteKeyWeHaveStoredExternally';
      process.env.NODE_ENV = 'production';
      const toEncrypt = 'should be able to decrypt simply locally'; // use same string, even though message is strange
      await $.encryptString(toEncrypt);
    } catch (error) {
      expect(error).toEqual(
        'Error CiphertextBlob coming from kms encrypt is undefined',
      );
    }
  });

  it('should return an error when AWS_REMOTE_KEYID is missing', async () => {
    try {
      process.env.IS_AWS_ENV = 'true';
      process.env.NODE_ENV = 'production';
      const toEncrypt = 'should be able to decrypt simply locally'; // use same string, even though message is strange
      await $.encryptString(toEncrypt);
    } catch (error) {
      expect(error).toEqual(
        new Error(
          'Calling kms encrypt function without setting the AWS_REMOTE_KEYID variable',
        ),
      );
    }
  });

  it('should callback after the decrypt', async () => {
    const result = await new Promise((resolve, reject) => {
      $.decryptCallback(resolve, reject)(undefined, {
        Plaintext: 'someString',
      });
    });
    expect(result).toEqual('someString');
  });

  it('should callback after the decrypt with an error', async () => {
    const err = new Error('unexpected error');
    try {
      await new Promise((resolve, reject) => {
        $.decryptCallback(resolve, reject)(err, {
          Plaintext: 'someString',
        });
      });
    } catch (error) {
      expect(error).toEqual(err);
    }
  });

  it('should callback after the decrypt with empty string if plaintext is undefined', async () => {
    const result = await new Promise((resolve, reject) => {
      $.decryptCallback(resolve, reject)(undefined, {});
    });
    expect(result).toEqual('');
  });

  it('should async decrypt', async () => {
    await $.asyncDecrypt('someInput');
  });

  it('should be able to decrypt remotely on aws', async () => {
    jest.spyOn($, 'asyncDecrypt').mockResolvedValue('someString');
    process.env.IS_AWS_ENV = 'true';
    process.env.NODE_ENV = 'production';
    const result = await $.decryptString(encrypted);
    delete process.env.IS_AWS_ENV;
    expect(result).toEqual('someString');
  });
});
