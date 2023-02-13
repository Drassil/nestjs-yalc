import { createMock } from '@golevelup/ts-jest';
import { LoggerService } from '@nestjs/common';
import { LoggerAbstractService } from '../logger-abstract.service.js';

class DummyLogger extends LoggerAbstractService {
  constructor(logLevels) {
    super('test', logLevels, createMock<LoggerService>());
  }
}

describe('Abstract logger service test', () => {
  it('Test error', async () => {
    expect(() => new DummyLogger(['dummy'])).toThrowError();
  });
});
