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
import { createMock } from '@golevelup/ts-jest';

import type S3 from 'aws-sdk/clients/s3.js';
const mockedS3 = createMock<S3>();

jest.mock('aws-sdk/clients/s3.js', () => {
  return jest.fn(() => mockedS3);
});

// import * as S3Helper from './aws-s3.helper.js'; // apparently jest.mock doesn't work with stack import. To investigate

const S3Helper = await import('../aws-s3.helper.js');

describe('AWS S3 Helper', () => {
  it('Should create a presigned Url', async () => {
    mockedS3.getSignedUrl.mockImplementationOnce(
      (_operations: string, _param: any, callback: any) => {
        callback(null, 'tempSignedUrl');
      },
    );

    const result = await S3Helper.getFileFromS3('filePath', 'bucket');
    expect(result).toBe('tempSignedUrl');
  });

  it('Should throw an error', async () => {
    mockedS3.getSignedUrl.mockImplementationOnce(
      (_operations: string, _param: any, callback: any) => {
        callback('someError', 'tempSignedUrl');
      },
    );

    try {
      await S3Helper.getFileFromS3('filePath', 'bucket');
    } catch (error) {
      expect(error).toEqual('someError');
    }
  });
});
