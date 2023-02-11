import S3 from 'aws-sdk/clients/s3.js';

const URL_EXPIRATION_TIME = 60;
export const getFileFromS3 = async (
  filePath: string,
  bucket: string,
): Promise<string> => {
  const s3 = new S3({
    region: process.env.S3_REGION,
  });
  return new Promise((resolve, reject) => {
    s3.getSignedUrl(
      'getObject',
      {
        Key: filePath,
        Bucket: bucket,
        Expires: URL_EXPIRATION_TIME,
      },
      (err: Error, url: string) => {
        if (err) {
          reject(err);
        }
        resolve(url);
      },
    );
  });
};
