import {
  describe,
  expect,
  it,
  jest,
  beforeAll,
  beforeEach,
  test,
} from '@jest/globals';
import { IntervalHelper } from '../interval.helper.js';

describe('interval helper test', () => {
  it('Generates interval of 1 day with miliseconds', () => {
    const interval = IntervalHelper.createOneDayInterval();

    expect(interval).toEqual(86400000);
  });

  it('Generates 1 second interval', () => {
    const interval = IntervalHelper.createOneSecondInterval();

    expect(interval).toEqual(1000);
  });
  it('Generates interval of 5 mins with miliseconds', () => {
    const interval = IntervalHelper.createFiveMinutesInterval();

    expect(interval).toEqual(300000);
  });
});
