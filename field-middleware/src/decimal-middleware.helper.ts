import { FieldMiddleware, MiddlewareContext, NextFn } from '@nestjs/graphql';

export const decimalMiddleware: FieldMiddleware = async (
  _ctx: MiddlewareContext,
  next: NextFn,
) => {
  return parseFloat(await next());
};
