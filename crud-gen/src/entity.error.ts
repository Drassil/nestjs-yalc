import { BadRequestException } from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm';

export enum EntityErrorsEnum {
  CREATION_FAILED = 'Resource has not been created',
  UPDATE_FAILED = 'Resource has not been updated',
  DELETE_FAILED = 'Resource has not been deleted',
}

export function isEntityNotFoundError(
  error: any,
): error is EntityNotFoundError {
  return (error as EntityNotFoundError).name === 'EntityNotFoundError';
}

export function isEntityError(error: any): error is EntityError {
  return (
    (error as EntityError).originalError !== undefined ||
    error instanceof EntityError
  );
}

export class EntityError extends BadRequestException {
  originalError: Error | undefined;
  constructor(message: string, error?: Error) {
    super(message);
    this.stack = error?.stack;
    this.originalError = error;
  }
}

export class CreateEntityError extends EntityError {
  constructor(error?: Error) {
    super(EntityErrorsEnum.CREATION_FAILED, error);
  }
}

export class UpdateEntityError extends EntityError {
  constructor(error?: Error) {
    super(EntityErrorsEnum.UPDATE_FAILED, error);
  }
}

export class DeleteEntityError extends EntityError {
  constructor(error?: Error) {
    super(EntityErrorsEnum.DELETE_FAILED, error);
  }
}
