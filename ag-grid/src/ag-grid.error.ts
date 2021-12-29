import { FilterErrors } from './strings.enum';

export class AgGridError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class AgGridInvalidArgumentError extends AgGridError {
  constructor() {
    super(FilterErrors.INVALID_ARGUMENT);
  }
}

export class AgGridInvalidOperatorError extends AgGridError {
  constructor() {
    super(FilterErrors.INVALID_OPERATOR);
  }
}

export class AgGridInvalidPropertyError extends AgGridError {
  constructor() {
    super(FilterErrors.INVALID_PROPERTY);
  }
}

export class AgGridConditionNotSupportedError extends AgGridError {
  constructor(info?: string) {
    super(FilterErrors.INVALID_CONDITION + (info ? `: ${info}` : ''));
  }
}

export class AgGridFilterNotSupportedError extends AgGridError {
  constructor(info?: string) {
    super(FilterErrors.FILTER_NOT_SUPPORTED + (info ? `: ${info}` : ''));
  }
}

export class AgGridBadFilterTypeError extends AgGridError {
  constructor() {
    super(FilterErrors.BAD_FILTER_TYPE);
  }
}

export class AgGridNotPossibleError extends AgGridError {
  constructor() {
    super(FilterErrors.NOT_POSSIBLE_EXCEPTION);
  }
}

export class AgGridStringWhereError extends AgGridError {
  constructor() {
    super(FilterErrors.STRING_WHERE);
  }
}

export class AgGridFilterProhibited extends AgGridError {
  constructor() {
    super(FilterErrors.FILTER_PROHIBITED);
  }
}
