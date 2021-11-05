import { FieldErrorsEnum } from '../fields-error.enum';
import {
  convertIfStringToDate,
  errorTrhow,
  stringIsInEnum,
  stringIsInEnumOrThrow,
  validateDate,
  validateDateOrThrow,
  validateStringFormat,
} from '../validator.helper';
import { StringFormatEnum } from '../string-format.enum';

describe('validator helper test', () => {
  it('convertIfStringToDate should work', async () => {
    let testData = convertIfStringToDate('2020 01 01');
    expect(testData).toBeInstanceOf(Date);

    testData = convertIfStringToDate(new Date());
    expect(testData).toBeInstanceOf(Date);
  });

  it('stringIsInEnum should work', async () => {
    let testData = stringIsInEnum(
      FieldErrorsEnum.INVALID_VALUE,
      FieldErrorsEnum,
    );
    expect(testData).toBeTruthy();

    testData = stringIsInEnum(
      `invalid_${FieldErrorsEnum.INVALID_VALUE}`,
      FieldErrorsEnum,
    );
    expect(testData).toBeFalsy();
  });

  it('stringIsInEnumOrThrow should work', async () => {
    const testData = stringIsInEnumOrThrow(
      FieldErrorsEnum.INVALID_VALUE,
      FieldErrorsEnum,
    );
    expect(testData).toBeTruthy();

    expect(() =>
      stringIsInEnumOrThrow(
        `invalid_${FieldErrorsEnum.INVALID_VALUE}`,
        FieldErrorsEnum,
      ),
    ).toThrowError();
  });

  it('validateDate should work', async () => {
    let testData = validateDate(new Date());
    expect(testData).toBeTruthy();

    testData = validateDate('');
    expect(testData).toBeFalsy();
  });

  it('validateDateOrThrow should work', async () => {
    const testData = validateDateOrThrow(new Date());
    expect(testData).toBeTruthy();

    expect(() => validateDateOrThrow('')).toThrowError();
  });

  it('validateStringFormat should work', async () => {
    let testData = validateStringFormat('<>', StringFormatEnum.ALL);
    expect(testData).toBeTruthy();

    testData = validateStringFormat('Eh! Volevi!', StringFormatEnum.ALL);
    expect(testData).toBeFalsy();
  });

  it('errorTrhow should work', async () => {
    expect(() => errorTrhow('')).toThrowError(FieldErrorsEnum.INVALID_VALUE);

    expect(() => errorTrhow('', 'customError')).toThrowError('customError');
  });
});
