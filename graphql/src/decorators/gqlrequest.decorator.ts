import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const paramDecoratorToCreate = (
  _data: unknown,
  context: ExecutionContext,
) => {
  const ctx = GqlExecutionContext.create(context);
  return ctx.getContext().req;
};

export const GqlGetRequest = createParamDecorator(paramDecoratorToCreate);
