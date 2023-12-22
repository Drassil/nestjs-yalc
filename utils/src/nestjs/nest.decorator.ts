import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const paramDecoratorToCreate = (
  _data: unknown,
  context: ExecutionContext,
) => {
  return context;
};

export const GetContext = createParamDecorator(paramDecoratorToCreate);
