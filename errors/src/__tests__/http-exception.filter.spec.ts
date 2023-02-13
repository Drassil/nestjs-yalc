import { expect, jest, test } from "@jest/globals";

import { createMock } from "@golevelup/ts-jest";
import { CreateEntityError } from "@nestjs-yalc/crud-gen/entity.error.js";
import { MissingArgumentsError } from "@nestjs-yalc/crud-gen/missing-arguments.error.js";
import {
  ArgumentsHost,
  LoggerService,
  UnprocessableEntityException
} from "@nestjs/common";
import { GqlArgumentsHost } from "@nestjs/graphql";
import { ExceptionContextEnum } from "../errors.enum.js";
import { HttpExceptionFilter } from "../filters/http-exception.filter.js";
import { GqlError } from "@nestjs-yalc/graphql/plugins/gql.error.js";
import { LoginError } from "../.js";
jest.mock("@nestjs/graphql");

describe("Http exceptions filter", () => {
  let filter: HttpExceptionFilter;
  const loggerServiceMock = createMock<LoggerService>();
  const mockArgumentsHost = createMock<ArgumentsHost>();

  beforeAll(() => {
    filter = new HttpExceptionFilter(loggerServiceMock);
  });

  it("should be defined", () => {
    expect(filter).toBeDefined();
  });

  it("should catch and log Application errors", () => {
    const error = new MissingArgumentsError();

    filter.catch(error, mockArgumentsHost);
    expect(loggerServiceMock.log).toBeCalledWith(
      error.message,
      error.stack,
      ExceptionContextEnum.HTTP
    );
  });

  it("should catch and log HttpException error", () => {
    const exception = new UnprocessableEntityException();

    filter.catch(exception, mockArgumentsHost);
    expect(loggerServiceMock.error).toBeCalledWith(
      exception,
      exception.stack,
      ExceptionContextEnum.HTTP
    );
  });

  it("should catch and log Entity error", () => {
    const exception = new CreateEntityError();

    filter.catch(exception, mockArgumentsHost);
    expect(loggerServiceMock.error).toBeCalledWith(
      exception,
      ExceptionContextEnum.HTTP
    );
  });

  it("should catch EntityError and log the original message", () => {
    const fixedError = new Error("message");
    const exception = new CreateEntityError(fixedError);

    filter.catch(exception, mockArgumentsHost);
    expect(loggerServiceMock.error).toBeCalledWith(
      fixedError.message,
      ExceptionContextEnum.HTTP
    );
  });

  it("should catch LoginError and the systemMessage", () => {
    const fixedError: LoginError = new LoginError("systemMessage");
    filter.catch(fixedError, mockArgumentsHost);
    expect(loggerServiceMock.log).toBeCalledWith(
      fixedError.systemMessage,
      fixedError.stack,
      ExceptionContextEnum.HTTP
    );
  });
  it("should catch and log GqlError error", () => {
    const exception: GqlError = new GqlError("message", "systemMessage");
    filter.catch(exception, mockArgumentsHost);
    expect(loggerServiceMock.error).toBeCalledWith(exception.systemMessage);

    exception.systemMessage = undefined;
    filter.catch(exception, mockArgumentsHost);
    expect(loggerServiceMock.error).toBeCalledWith(exception.message);
  });

  it("should catch and log Entity error with gqlHost type http", () => {
    const exception = new CreateEntityError();
    GqlArgumentsHost.create = jest.fn().mockReturnValue({
      getType: jest.fn().mockReturnValue("http")
    });
    filter.catch(exception, mockArgumentsHost as ArgumentsHost);
    expect(loggerServiceMock.error).toBeCalledWith(
      exception,
      ExceptionContextEnum.HTTP
    );
  });
});
