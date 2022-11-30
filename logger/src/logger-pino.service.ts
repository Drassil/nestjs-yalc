import { LogLevel } from '@nestjs/common';
import { default as pino, Logger, stdTimeFunctions } from 'pino';
import { LoggerAbstractService } from './logger-abstract.service';
import { maskDataInObject } from './logger.helper';

let logger: Logger;

export const FLUSH_INTERVAL = 10000;

export class PinoLogger extends LoggerAbstractService {
  constructor(context: string, logLevels: LogLevel[]) {
    super(context, logLevels, {
      log: (message, methodContext, options) =>
        logger.info(
          { context: methodContext ?? context },
          `${message}`,
          maskDataInObject(options?.data, options?.masks),
        ),
      error: (message, methodContext, trace, options) =>
        logger.error(
          { context: methodContext ?? context },
          `${message} ${trace}`,
          maskDataInObject(options?.data, options?.masks),
        ),
      debug: (message, methodContext, options) =>
        logger.debug(
          { context: methodContext ?? context },
          `${message}`,
          maskDataInObject(options?.data, options?.masks),
        ),
      warn: (message, methodContext, options) =>
        logger.warn(
          { context: methodContext ?? context },
          `${message}`,
          maskDataInObject(options?.data, options?.masks),
        ),
      verbose: (message, methodContext, options) =>
        logger.trace(
          { context: methodContext ?? context },
          `${message}`,
          maskDataInObject(options?.data, options?.masks),
        ),
    });

    if (!logger) {
      const dest = pino.destination({ sync: false });
      logger = pino(
        {
          // base: {
          //   memorySize: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
          //   region: process.env.AWS_REGION,
          //   runtime: process.env.AWS_EXECUTION_ENV,
          //   version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
          // },
          // name: process.env.AWS_LAMBDA_FUNCTION_NAME,
          // level: process.env.LOG_LEVEL || 'info',
          formatters: {
            level: (label: string) => {
              return { level: label };
            },
          },
          timestamp: stdTimeFunctions.isoTime,
        },
        dest,
      );
    }

    logger.level = 'trace'; // enable all. Levels are handled by the Service.

    // asynchronously flush every 10 seconds to keep the buffer empty
    // in periods of low activity
    setInterval(function () {
      logger.flush();
    }, FLUSH_INTERVAL).unref();

    // TODO: remove it if it's not needed anymore (https://github.com/pinojs/pino/pull/1240/files)
    // use pino.final to create a special logger that
    // guarantees final tick writes
    // const handler = pino.destination(
    //   logger,
    //   (err: String, finalLogger: Logger, evt: String) => {
    //     finalLogger.info(`${evt} caught`);
    //     if (err) finalLogger.error(err, 'error caused exit');
    //     process.exit(err ? 1 : 0);
    //   },
    // );
    // // catch all the ways node might exit
    // process.on('beforeExit', () => handler(null, 'beforeExit'));
    // process.on('exit', () => handler(null, 'exit'));
    // process.on('uncaughtException', (err) => handler(err, 'uncaughtException'));
    // process.on('SIGINT', () => handler(null, 'SIGINT'));
    // process.on('SIGQUIT', () => handler(null, 'SIGQUIT'));
    // process.on('SIGTERM', () => handler(null, 'SIGTERM'));
  }
}
