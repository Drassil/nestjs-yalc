import { Logger } from 'pino';
import { PinoLogger, FLUSH_INTERVAL } from '../logger-pino.service.js';
import { LOG_LEVEL_ALL } from '../logger.enum.js';

describe('Pino logger service test', () => {
  let logger: PinoLogger;
  let pino: Logger;

  beforeEach(async () => {
    logger = new PinoLogger('test', LOG_LEVEL_ALL);
    pino = logger.getLogger();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Test log', async () => {
    const method = jest.spyOn(pino, 'info');
    logger.log('test');

    expect(method).toHaveBeenCalled();
  });

  it('Test error', async () => {
    const method = jest.spyOn(pino, 'error');
    logger.error('error', 'trace');

    expect(method).toHaveBeenCalled();
    // expect(method).toHaveBeenCalledWith({ context: 'test' }, 'error trace');
  });

  it('Test warn', async () => {
    const method = jest.spyOn(pino, 'warn');
    logger.warn('warn');

    expect(method).toHaveBeenCalled();
  });

  it('Test debug', async () => {
    const method = jest.spyOn(pino, 'debug');
    logger.debug?.('debug');

    expect(method).toHaveBeenCalled();
  });

  it('Test verbose & flush', async () => {
    jest.useFakeTimers();

    jest.mock('process', () => ({
      on: jest.fn((fn) => {
        fn();
      }),
    }));

    const _logger = new PinoLogger('test', LOG_LEVEL_ALL);

    const method = jest.spyOn(pino, 'trace');
    _logger.verbose?.('verbose');

    // Fast-forward until all timers have been executed
    jest.advanceTimersByTime(FLUSH_INTERVAL + 1000);

    expect(method).toHaveBeenCalled();
  });
});
