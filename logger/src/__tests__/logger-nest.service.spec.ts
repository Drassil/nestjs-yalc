import { expect, describe, it } from '@jest/globals';
import { ImprovedNestLogger } from '../index.js';

describe('Nest logger service test', () => {
  it('Test log', async () => {
    const logger = new ImprovedNestLogger('test', {});
    logger.log('test');
  });

  it('Test log with string options', async () => {
    const logger = new ImprovedNestLogger('test', {});
    logger.log('test', 'string options');
  });

  it('Test log with masked data', async () => {
    const logger = new ImprovedNestLogger('test', {});
    logger.log('test', { masks: ['pass'], data: { pass: 'data' } });
  });

  it('Test error', async () => {
    const logger = new ImprovedNestLogger('test', {});
    logger.error('error', 'trace');
  });

  it('Test warn', async () => {
    const logger = new ImprovedNestLogger('test', {});
    logger.warn('warn');
  });

  it('Test debug', async () => {
    const logger = new ImprovedNestLogger('test', {});
    logger.debug?.('debug');
  });

  it('Test verbose', async () => {
    const logger = new ImprovedNestLogger('test', {});
    logger.verbose?.('verbose');
  });
});
