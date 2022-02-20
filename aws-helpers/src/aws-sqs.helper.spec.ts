import { createMock } from '@golevelup/ts-jest';
import * as SqsHelper from './aws-sqs.helper';

jest.mock('aws-sdk', () => {
  const mockedSqs = createMock<AWS.SQS>();

  mockedSqs.sendMessage.mockImplementationOnce((param: any, callback: any) => {
    callback(undefined, 'data');
  });

  mockedSqs.sendMessage.mockImplementationOnce((param: any, callback: any) => {
    callback('someError', 'data');
  });

  return {
    SQS: jest.fn(() => mockedSqs),
  };
});

describe('AWS S3 Helper', () => {
  it('Should send a message on SQS', async () => {
    await expect(
      SqsHelper.pushToAwsSQS(
        {
          endpoint: 'endpoint',
          queueName: 'queueName',
          region: 'region',
        },
        'message',
      ),
    ).resolves.toBe(undefined);
  });

  it('Should throw an error', async () => {
    await expect(
      SqsHelper.pushToAwsSQS(
        {
          endpoint: 'endpoint',
          queueName: 'queueName',
          region: 'region',
        },
        'message',
      ),
    ).rejects.toBeDefined();
  });
});
