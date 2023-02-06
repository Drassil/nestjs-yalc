import { createMock } from '@golevelup/ts-jest';
import { MiddlewareContext } from '@nestjs/graphql';
import { nullableTimestampMiddleware } from '../nullable-timestamp-middleware.helper.js';

describe('Date middleware helper test', () => {
  it('should return the value as null', async () => {
    const ctx = createMock<MiddlewareContext>();
    let next = jest.fn().mockResolvedValue('0000-00-00 00:00:00');
    const date = await nullableTimestampMiddleware(ctx, next);
    expect(date).toEqual(null);

    next = jest.fn().mockResolvedValue('');
    const date2 = await nullableTimestampMiddleware(ctx, next);
    expect(date2).toEqual(null);
  });

  it('should return the date correctly', async () => {
    const testingDate = '2021-06-21 11:43:54';
    const ctx = createMock<MiddlewareContext>();
    const next = jest.fn().mockResolvedValue(testingDate);
    const date = await nullableTimestampMiddleware(ctx, next);

    expect(date).toEqual(testingDate);
  });
});
