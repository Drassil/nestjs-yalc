import {
  PinoLogger,
  logger as pino,
  FLUSH_INTERVAL,
} from './logger-pino.service';
import { LOG_LEVEL_ALL } from './logger.enum';

describe('Pino logger service test', () => {
  let logger: PinoLogger;

  beforeEach(async () => {
    logger = new PinoLogger('test', LOG_LEVEL_ALL);
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
    expect(method).toHaveBeenCalledWith({}, '[test] error trace');
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

  it('Test process events', async () => {
    const processOn = jest.spyOn(process, 'on');
    processOn.mockImplementation((event, listener) => {
      listener();
      return process;
    });

    const processExit = jest
      .spyOn(process, 'exit')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .mockImplementation(() => {});

    new PinoLogger('test', LOG_LEVEL_ALL);

    expect(processExit).toHaveBeenCalled();
  });

  it('Test process events with Error', async () => {
    const processOn = jest.spyOn(process, 'on');
    processOn.mockImplementation((event, listener) => {
      listener('fakeError');
      return process;
    });

    const processExit = jest
      .spyOn(process, 'exit')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .mockImplementation(() => {});

    new PinoLogger('test', LOG_LEVEL_ALL);

    expect(processExit).toHaveBeenCalled();
  });
});
