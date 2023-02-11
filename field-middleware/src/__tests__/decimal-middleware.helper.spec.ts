import { expect, jest, test } from "@jest/globals";

import { createMock } from "@golevelup/ts-jest";
import { MiddlewareContext } from "@nestjs/graphql";
import { decimalMiddleware } from "../decimal-middleware.helper.js";

describe("Decimal middleware helper test", () => {
  // it('should return the value as float', async () => {
  //   const ctx = createMock<MiddlewareContext>();
  //   const next = jest.fn().mockResolvedValue('500.2');
  //   const float = await decimalMiddleware(ctx, next);

  //   expect(float).not.toEqual(expect.any(String));
  //   expect(float).toEqual(expect.any(Number));
  //   expect(float).toEqual(500.2);
  // });

  it("should return the value a", async () => {
    const ctx = createMock<MiddlewareContext>();
    const next = jest.fn().mockResolvedValue("500.2");
    const float = await decimalMiddleware(ctx, next);

    expect(float).toEqual(expect.any(String));
    expect(float).toEqual("500.2");
  });
});
