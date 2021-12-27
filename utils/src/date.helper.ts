export class DateHelper {
  /**
   * Function that returns interface of startDate being current date and endDate being 1 week earlier
   * @returns
   */
  static getWeekEdgeDates(): { startDate: string; endDate: string } {
    const currentDate = Date.now();
    const weekInMs = 1000 * 60 * 60 * 24 * 7;

    const startDate = new Date(new Date(currentDate).getTime() - weekInMs);
    const endDate = new Date(currentDate);

    const startDateMonth = DateHelper.formatMonth(startDate.getMonth());

    const startDateDay = DateHelper.formatDay(startDate.getDate());

    const endDateMonth = DateHelper.formatMonth(endDate.getMonth());

    const endDateDay = DateHelper.formatDay(endDate.getDate());

    const queryStartDate = `${startDate.getFullYear()}-${startDateMonth}-${startDateDay}`;

    const queryEndDate = `${endDate.getFullYear()}-${endDateMonth}-${endDateDay}`;

    return { startDate: queryStartDate, endDate: queryEndDate };
  }

  /**
   *
   * @param num number of day or month
   * @returns formatted number, like 3rd month (number 3 passed) returns string '03'
   */
  static formatMonth(month: number): string {
    const fixedMonth = month + 1;
    return fixedMonth < 10 ? `0${fixedMonth}` : `${fixedMonth}`;
  }

  static formatDay(day: number): string {
    return day < 10 ? `0${day}` : `${day}`;
  }

  static subsMinutes(date: Date, minutes: number): Date {
    const result = new Date(date.getTime());
    result.setMinutes(result.getMinutes() - minutes);
    return result;
  }

  static addMinutes(date: Date, minutes: number): Date {
    const result = new Date(date.getTime());
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  static dateToSQLDateTime(date: Date) {
    return date.toISOString().slice(0, 19).replace("T", " ");
  }
}
