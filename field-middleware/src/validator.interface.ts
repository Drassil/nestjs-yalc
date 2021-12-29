export enum DateCheckTypeEnum {
  MAX = 'max',
  MIN = 'min',
}

export interface IDate {
  year: number;
  month: number;
  date: number;
}

export interface IDateCheck {
  checkType: DateCheckTypeEnum;
  dateToAdd: IDate;
}
export interface IStringFormatMatchCheckOptions {
  toMatch: boolean;
  pattern: string;
}
