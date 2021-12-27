/* eslint-disable no-console */
import { LogLevel } from "@nestjs/common";
import { LoggerAbstractService } from "./logger-abstract.service";

export class ConsoleLogger extends LoggerAbstractService {
  constructor(context: string, logLevels: LogLevel[] | undefined) {
    super(context, logLevels, {
      log: (message) => console.log(`[${context}]`, message),
      error: (message, trace) => console.error(`[${context}]`, message, trace),
      debug: (message) => console.debug(`[${context}]`, message),
      warn: (message) => console.warn(`[${context}]`, message),
      verbose: (message) => console.info(`[${context}]`, message),
    });
  }
}
