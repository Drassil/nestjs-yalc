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

jest.mock('aws-sdk', () => {
  const mockedSqs = createMock<AWS.SQS>();

  mockedSqs.sendMessage.mockImplementationOnce((err: any, callback: any) => {
    return callback(undefined, 'data');
  });

  mockedSqs.sendMessage.mockImplementationOnce((err: any, callback: any) => {
    return callback('someError', 'data');
  });

  return {
    SQS: jest.fn(() => mockedSqs),
  };
});

const SqsHelper = await import('../aws-sqs.helper.js');

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
