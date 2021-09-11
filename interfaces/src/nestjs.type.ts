import { DynamicModule, ForwardReference, Type } from '@nestjs/common';

export type ImportType =
  | Type<any>
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference<any>;

export type IDecoratorType =
  | ClassDecorator
  | MethodDecorator
  | PropertyDecorator;
