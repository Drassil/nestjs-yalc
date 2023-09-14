import { LogLevel } from '@nestjs/common';
import { pino, Logger, stdTimeFunctions } from 'pino';
import {
  type IImprovedLoggerOptions,
  LoggerAbstractService,
} from './logger-abstract.service.js';
import { maskDataInObject } from './logger.helper.js';

let logger: Logger;

export const FLUSH_INTERVAL = 10000;

export class PinoLogger extends LoggerAbstractService {
  getLogger(): Logger {
    return logger;
  }

  constructor(
    context: string,
    logLevels: LogLevel[],
    options: IImprovedLoggerOptions = {},
  ) {
    super(
      context,
      logLevels,
      {
        log: (message, options) =>
          logger.info(
            {
              context: options?.context ?? context,
              data: maskDataInObject(options?.data, options?.masks),
            },
            `${message} ${options?.trace}`,
          ),
        error: (message, trace, options) =>
          logger.error(
            {
              context: options?.context ?? context,
              data: maskDataInObject(options?.data, options?.masks),
            },
            `${message} ${trace}`,
          ),
        debug: (message, options) =>
          logger.debug(
            {
              context: options?.context ?? context,
              data: maskDataInObject(options?.data, options?.masks),
            },
            `${message} ${options?.trace}`,
          ),
        warn: (message, options) =>
          logger.warn(
            {
              context: options?.context ?? context,
              data: maskDataInObject(options?.data, options?.masks),
            },
            `${message} ${options?.trace}`,
          ),
        verbose: (message, options) =>
          logger.trace(
            {
              context: options?.context ?? context,
              data: maskDataInObject(options?.data, options?.masks),
            },
            `${message} ${options?.trace}`,
          ),
      },
      options,
    );

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
