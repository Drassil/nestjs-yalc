export class IntervalHelper {
  static createOneDayInterval(): number {
    return 24 * 60 * 60 * 1000;
  }

  static createOneSecondInterval(): number {
    return 1000;
  }

  static createFiveMinutesInterval(): number {
    return 1000 * 60 * 5;
  }
}
