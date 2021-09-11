import { ConsoleLogger } from './logger-console.service';
import { LOG_LEVEL_ALL } from './logger.enum';

describe('Console logger service test', () => {
  let logger: ConsoleLogger;

  beforeEach(async () => {
    logger = new ConsoleLogger(LOG_LEVEL_ALL);
  });

  it('Test undefined levels', async () => {
    const method = jest.spyOn(console, 'log');
    logger = new ConsoleLogger(undefined);
    logger.log?.('test');

    expect(method).not.toHaveBeenCalled();
  });

  it('Test log', async () => {
    const method = jest.spyOn(console, 'log');
    logger.log?.('test');

    expect(method).toHaveBeenCalled();
  });

  it('Test error', async () => {
    const method = jest.spyOn(console, 'error');
    logger.error?.('error', 'trace');

    expect(method).toHaveBeenCalled();
    expect(method).toHaveBeenCalledWith('error', 'trace');
  });

  it('Test warn', async () => {
    const method = jest.spyOn(console, 'warn');
    logger.warn?.('warn');

    expect(method).toHaveBeenCalled();
  });

  it('Test debug', async () => {
    const method = jest.spyOn(console, 'debug');
    logger.debug?.('debug');

    expect(method).toHaveBeenCalled();
  });

  it('Test verbose', async () => {
    const method = jest.spyOn(console, 'info');
    logger.verbose?.('verbose');

    expect(method).toHaveBeenCalled();
  });
});
