import { expect, jest, test } from "@jest/globals";

import { StringFormatEnum } from "../string-format.enum.js";
import * as Validator from "../validator.decorator.js";
import * as ValidatorHelper from "../validator.helper.js";
import * as ClassValidator from "class-validator";

ClassValidator as jest.Mocked<typeof ClassValidator>;
describe("validator decorator test", () => {
  it("StringFormatMatchValidation is defined", async () => {
    let testData = Validator.StringFormatMatchValidation();
    expect(testData("", "")).not.toBeDefined(); //This is only for the coverage

    testData = Validator.StringFormatMatchValidation({});
    expect(testData).toBeDefined();
  });

  it("DateValidation is defined", async () => {
    let testData = Validator.DateValidation();
    expect(testData("", "")).not.toBeDefined(); //This is only for the coverage

    testData = Validator.DateValidation({});
    expect(testData).toBeDefined();
  });

  it("stringFormatMatchValidatorFactory return the correct result", async () => {
    const spiedValidate = jest.spyOn(ValidatorHelper, "validateStringFormat");
    const testDataFunctionMatch = Validator.stringFormatMatchValidatorFactory({
      toMatch: true,
      pattern: StringFormatEnum.ALL
    });
    const testDataFunctionDontMatch =
      Validator.stringFormatMatchValidatorFactory({
        toMatch: false,
        pattern: StringFormatEnum.ALL
      });

    spiedValidate.mockReturnValueOnce(true);
    expect(testDataFunctionMatch.validate("")).toEqual(true);
    spiedValidate.mockReturnValueOnce(true);
    expect(testDataFunctionDontMatch.validate("")).toEqual(false);

    spiedValidate.mockReturnValueOnce(false);
    expect(testDataFunctionMatch.validate("")).toEqual(false);
    spiedValidate.mockReturnValueOnce(false);
    expect(testDataFunctionDontMatch.validate("")).toEqual(true);
  });

  it("dateValidatorFactory return validateDate's result", async () => {
    const spiedValidate = jest.spyOn(ValidatorHelper, "validateDate");
    const testDataFunction = Validator.dateValidatorFactory();

    spiedValidate.mockReturnValueOnce(true);
    expect(testDataFunction.validate("")).toEqual(true);
    spiedValidate.mockReturnValueOnce(false);
    expect(testDataFunction.validate("")).toEqual(false);
  });
});
