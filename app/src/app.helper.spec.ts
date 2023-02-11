import { expect, jest, test } from "@jest/globals";

import { createMock, DeepMocked } from "@golevelup/ts-jest";
import { DynamicModule } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  curriedExecuteStandaloneFunction,
  executeStandaloneFunction
} from "./app.helper.js";

describe("test standalone app functions", () => {
  let mockedModule: DeepMocked<DynamicModule>;
  let mockedServiceFunction: jest.Mock<string, []>;

  beforeEach(async () => {
    mockedServiceFunction = jest.fn(() => "Test");

    mockedModule = createMock<DynamicModule>({});

    const mockedCreateApplicationContext = jest.spyOn(
      NestFactory,
      "createApplicationContext"
    );

    mockedCreateApplicationContext.mockImplementation(
      () =>
        ({
          get: mockedServiceFunction,
          close: jest.fn()
        } as any)
    );
  });

  it("should run executeStandaloneFunction", async () => {
    const mockedFunction = jest.fn(async (service: any) => {
      return service;
    });

    await executeStandaloneFunction(
      mockedModule,
      mockedServiceFunction,
      mockedFunction
    );

    expect(mockedServiceFunction).toHaveBeenCalledTimes(1);
    expect(mockedFunction).toHaveBeenCalledTimes(1);
  });

  it("should run curriedExecuteStandaloneFunction", async () => {
    const mockedFunction = jest.fn(async (service: any) => {
      return service;
    });

    const curried = await curriedExecuteStandaloneFunction(mockedModule);
    curried(mockedServiceFunction)(mockedFunction);

    expect(mockedFunction).toHaveBeenNthCalledWith(1, "Test");
  });
});
