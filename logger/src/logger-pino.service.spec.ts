import { PinoLogger, logger as pino } from './logger-pino.service';
import { LOG_LEVEL_ALL } from './logger.enum';

describe('Pino logger service test', () => {
  let logger: PinoLogger;

  beforeEach(async () => {
    logger = new PinoLogger(LOG_LEVEL_ALL);
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
    expect(method).toHaveBeenCalledWith('error', 'trace', undefined);
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

  it('Test verbose', async () => {
    const method = jest.spyOn(pino, 'info');
    logger.verbose?.('verbose');

    expect(method).toHaveBeenCalled();
  });
});
