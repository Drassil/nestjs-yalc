import { LogLevel } from "@nestjs/common";
import { default as pino } from "pino";
import { LoggerAbstractService } from "./logger-abstract.service";

const dest = pino.destination({ sync: false });
export const logger = pino(
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
      level: (label) => {
        return { level: label };
      },
    },
  },
  dest
);

export const FLUSH_INTERVAL = 10000;

export class PinoLogger extends LoggerAbstractService {
  constructor(context: string, logLevels: LogLevel[]) {
    super(context, logLevels, {
      log: (message) => logger.info({}, `[${context}] ${message}`),
      error: (message, trace) =>
        logger.error({}, `[${context}] ${message} ${trace}`),
      debug: (message) => logger.debug({}, `[${context}] ${message}`),
      warn: (message) => logger.warn({}, `[${context}] ${message}`),
      verbose: (message) => logger.trace({}, `[${context}] ${message}`),
    });

    logger.level = "trace"; // enable all. Levels are handled by the Service.

    // asynchronously flush every 10 seconds to keep the buffer empty
    // in periods of low activity
    setInterval(function () {
      logger.flush();
    }, FLUSH_INTERVAL).unref();

    // use pino.final to create a special logger that
    // guarantees final tick writes
    const handler = pino.final(logger, (err, finalLogger, evt) => {
      finalLogger.info(`${evt} caught`);
      if (err) finalLogger.error(err, "error caused exit");
      process.exit(err ? 1 : 0);
    });
    // catch all the ways node might exit
    process.on("beforeExit", () => handler(null, "beforeExit"));
    process.on("exit", () => handler(null, "exit"));
    process.on("uncaughtException", (err) => handler(err, "uncaughtException"));
    process.on("SIGINT", () => handler(null, "SIGINT"));
    process.on("SIGQUIT", () => handler(null, "SIGQUIT"));
    process.on("SIGTERM", () => handler(null, "SIGTERM"));
  }
}
