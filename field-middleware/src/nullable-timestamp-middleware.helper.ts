import { FieldMiddleware, MiddlewareContext, NextFn } from "@nestjs/graphql";

/**
 * Parses an invalid or empty timestamp to null to avoid GraphQLISODateTime parsing issues
 */
export const nullableTimestampMiddleware: FieldMiddleware = async (
  _ctx: MiddlewareContext,
  next: NextFn
) => {
  const date = await next();
  return "0000-00-00 00:00:00" === date || !date ? null : date;
};
