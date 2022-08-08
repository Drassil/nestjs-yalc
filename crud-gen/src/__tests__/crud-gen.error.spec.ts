import {
  CrudGenBadFilterTypeError,
  CrudGenFilterNotSupportedError,
  CrudGenFilterProhibited,
  CrudGenInvalidArgumentError,
  CrudGenInvalidOperatorError,
  CrudGenInvalidPropertyError,
  CrudGenNotPossibleError,
  CrudGenConditionNotSupportedError,
  CrudGenStringWhereError,
} from '../crud-gen.error';
import { FilterErrors } from '../strings.enum';

describe('CrudGen module errors', () => {
  it('should have defined errors', () => {
    const invalidArgumentError = new CrudGenInvalidArgumentError();
    expect(invalidArgumentError.message).toBe(FilterErrors.INVALID_ARGUMENT);

    const invalidOperatorError = new CrudGenInvalidOperatorError();
    expect(invalidOperatorError.message).toBe(FilterErrors.INVALID_OPERATOR);

    const invalidPropertyError = new CrudGenInvalidPropertyError();
    expect(invalidPropertyError.message).toBe(FilterErrors.INVALID_PROPERTY);

    const operatorNotSupportedError = new CrudGenConditionNotSupportedError();
    expect(operatorNotSupportedError.message).toBe(
      FilterErrors.INVALID_CONDITION,
    );

    const filterNotSupportedError = new CrudGenFilterNotSupportedError();
    expect(filterNotSupportedError.message).toBe(
      FilterErrors.FILTER_NOT_SUPPORTED,
    );

    const badFilterTypeError = new CrudGenBadFilterTypeError();
    expect(badFilterTypeError.message).toBe(FilterErrors.BAD_FILTER_TYPE);

    const notPossibleError = new CrudGenNotPossibleError();
    expect(notPossibleError.message).toBe(FilterErrors.NOT_POSSIBLE_EXCEPTION);

    const stringWhereError = new CrudGenStringWhereError();
    expect(stringWhereError.message).toBe(FilterErrors.STRING_WHERE);

    const stringFilterProhibited = new CrudGenFilterProhibited();
    expect(stringFilterProhibited.message).toBe(FilterErrors.FILTER_PROHIBITED);
  });
});
