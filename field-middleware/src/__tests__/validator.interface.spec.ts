import { StringFormatEnum } from '../string-format.enum.js';
import {
  DateCheckTypeEnum,
  IDate,
  IDateCheck,
  IStringFormatMatchCheckOptions,
} from '../validator.interface.js';

describe('validator interface test', () => {
  it('All the interfaces are defined', async () => {
    const testData_1: IDate = {
      year: 2020,
      month: 1,
      date: 1,
    };

    expect(testData_1).toBeDefined();
    const testData_2: IDateCheck = {
      checkType: DateCheckTypeEnum.MAX,
      dateToAdd: testData_1,
    };

    expect(testData_2).toBeDefined();
    const testData_3: IStringFormatMatchCheckOptions = {
      toMatch: true,
      pattern: StringFormatEnum.ALL,
    };
    expect(testData_3).toBeDefined();
  });

  expect(DateCheckTypeEnum).toBeDefined();
});
