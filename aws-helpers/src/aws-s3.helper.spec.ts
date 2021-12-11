import { createMock } from '@golevelup/ts-jest';
import * as S3Helper from './aws-s3.helper';

jest.mock('aws-sdk', () => {
  const mockedS3 = createMock<AWS.S3>();

  mockedS3.getSignedUrl.mockImplementationOnce(
    (operations: string, param: any, callback: any) => {
      callback(null, 'tempSignedUrl');
    },
  );

  mockedS3.getSignedUrl.mockImplementationOnce(
    (operations: string, param: any, callback: any) => {
      callback('someError', 'tempSignedUrl');
    },
  );

  return {
    S3: jest.fn(() => mockedS3),
  };
});

describe('AWS S3 Helper', () => {
  it('Should create a presigned Url', async () => {
    const result = await S3Helper.getFileFromS3('filePath');
    expect(result).toBe('tempSignedUrl');
  });

  it('Should throw an error', async () => {
    try {
      await S3Helper.getFileFromS3('filePath');
    } catch (error) {
      expect(error).toEqual('someError');
    }
  });
});
