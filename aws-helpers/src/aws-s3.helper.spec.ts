import { expect, jest, test } from "@jest/globals";

jest.mock("aws-sdk", () => {
  const mockedS3 = createMock<AWS.S3>();

  mockedS3.getSignedUrl.mockImplementationOnce(
    (_operations: string, _param: any) => {
      return "tempSignedUrl";
    }
  );

  mockedS3.getSignedUrl.mockImplementationOnce(
    (_operations: string, _param: any) => {
      return "tempSignedUrl";
    }
  );

  return {
    S3: jest.fn(() => mockedS3)
  };
});

import { createMock } from "@golevelup/ts-jest";
import * as S3Helper from "./aws-s3.helper.js";

describe("AWS S3 Helper", () => {
  it("Should create a presigned Url", async () => {
    const result = await S3Helper.getFileFromS3("filePath", "bucket");
    expect(result).toBe("tempSignedUrl");
  });

  it("Should throw an error", async () => {
    try {
      await S3Helper.getFileFromS3("filePath", "bucket");
    } catch (error) {
      expect(error).toEqual("someError");
    }
  });
});
