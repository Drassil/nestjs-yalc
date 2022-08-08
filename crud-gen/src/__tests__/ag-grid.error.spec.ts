import {
  AgGridBadFilterTypeError,
  AgGridFilterNotSupportedError,
  AgGridFilterProhibited,
  AgGridInvalidArgumentError,
  AgGridInvalidOperatorError,
  AgGridInvalidPropertyError,
  AgGridNotPossibleError,
  AgGridConditionNotSupportedError,
  AgGridStringWhereError,
} from '../ag-grid.error';
import { FilterErrors } from '../strings.enum';

describe('AgGrid module errors', () => {
  it('should have defined errors', () => {
    const invalidArgumentError = new AgGridInvalidArgumentError();
    expect(invalidArgumentError.message).toBe(FilterErrors.INVALID_ARGUMENT);

    const invalidOperatorError = new AgGridInvalidOperatorError();
    expect(invalidOperatorError.message).toBe(FilterErrors.INVALID_OPERATOR);

    const invalidPropertyError = new AgGridInvalidPropertyError();
    expect(invalidPropertyError.message).toBe(FilterErrors.INVALID_PROPERTY);

    const operatorNotSupportedError = new AgGridConditionNotSupportedError();
    expect(operatorNotSupportedError.message).toBe(
      FilterErrors.INVALID_CONDITION,
    );

    const filterNotSupportedError = new AgGridFilterNotSupportedError();
    expect(filterNotSupportedError.message).toBe(
      FilterErrors.FILTER_NOT_SUPPORTED,
    );

    const badFilterTypeError = new AgGridBadFilterTypeError();
    expect(badFilterTypeError.message).toBe(FilterErrors.BAD_FILTER_TYPE);

    const notPossibleError = new AgGridNotPossibleError();
    expect(notPossibleError.message).toBe(FilterErrors.NOT_POSSIBLE_EXCEPTION);

    const stringWhereError = new AgGridStringWhereError();
    expect(stringWhereError.message).toBe(FilterErrors.STRING_WHERE);

    const stringFilterProhibited = new AgGridFilterProhibited();
    expect(stringFilterProhibited.message).toBe(FilterErrors.FILTER_PROHIBITED);
  });
});
