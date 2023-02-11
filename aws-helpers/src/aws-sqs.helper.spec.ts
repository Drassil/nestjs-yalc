import { expect, jest, test } from "@jest/globals";

jest.mock("aws-sdk", () => {
  const mockedSqs = createMock<AWS.SQS>();

  mockedSqs.sendMessage.mockImplementationOnce((callback: any) => {
    return callback(undefined, "data");
  });

  mockedSqs.sendMessage.mockImplementationOnce((callback: any) => {
    return callback("someError", "data");
  });

  return {
    SQS: jest.fn(() => mockedSqs)
  };
});

import { createMock } from "@golevelup/ts-jest";
import * as SqsHelper from "./aws-sqs.helper.js";

describe("AWS S3 Helper", () => {
  it("Should send a message on SQS", async () => {
    await expect(
      SqsHelper.pushToAwsSQS(
        {
          endpoint: "endpoint",
          queueName: "queueName",
          region: "region"
        },
        "message"
      )
    ).resolves.toBe(undefined);
  });

  it("Should throw an error", async () => {
    await expect(
      SqsHelper.pushToAwsSQS(
        {
          endpoint: "endpoint",
          queueName: "queueName",
          region: "region"
        },
        "message"
      )
    ).rejects.toBeDefined();
  });
});
