import { ConflictException, NotFoundException } from '@nestjs/common';

export class ConditionsTooBroadError extends ConflictException {
  constructor(conditions: any) {
    super(
      { conditions },
      'The provided conditions are too broad and affect multiple records.',
    );
  }
}

export class NoResultsFoundError extends NotFoundException {
  constructor(conditions: any) {
    super({ conditions }, 'No results found for the provided conditions.');
  }
}
