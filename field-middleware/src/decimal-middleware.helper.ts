import { FieldMiddleware, MiddlewareContext, NextFn } from '@nestjs/graphql';

// eslint-disable-next-line @typescript-eslint/no-var-requires
/**
 * @todo Apply conversion if needed for number with more than scale = 11
 */
export const decimalMiddleware: FieldMiddleware = async (
  _ctx: MiddlewareContext,
  next: NextFn,
) => {
  return await next();
};
