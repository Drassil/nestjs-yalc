import { YalcEventService } from '@nestjs-yalc/event-manager/event.service.js';
import { envIsTrue } from '@nestjs-yalc/utils';
import { Logger } from 'typeorm';
import { LoggerEvent } from './logger.event.js';

export class TypeORMLogger implements Logger {
  private isLoggerEnabled = false;

  constructor(private event: YalcEventService) {
    this.isLoggerEnabled = envIsTrue(process.env.TYPEORM_LOGGING || 'false');
  }

  /**
   * Logs query and parameters used in it.
   */
  logQuery(
    query: string,
    parameters?: any[] /*, queryRunner?: QueryRunner*/,
  ): any {
    if (!this.isLoggerEnabled) return;

    /* istanbul ignore next */
    this.event.debug?.(LoggerEvent.QUERY_LOG, {
      data: {
        query,
        parameters,
      },
    });
  }
  /**
   * Logs query that is failed.
   */
  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    // queryRunner?: QueryRunner,
  ): any {
    if (!this.isLoggerEnabled) return;

    /* istanbul ignore next */
    this.event.error?.(LoggerEvent.QUERY_ERROR, {
      data: {
        error,
        query,
        parameters,
      },
    });
  }
  /**
   * Logs query that is slow.
   */
  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    // queryRunner?: QueryRunner,
  ): any {
    if (!this.isLoggerEnabled) return;

    /* istanbul ignore next */
    this.event.warn?.(LoggerEvent.QUERY_SLOW, {
      message: `SLOW QUERY!!!!`,
      data: {
        time,
        query,
        parameters,
      },
    });
  }
  /**
   * Logs events from the schema build process.
   */
  logSchemaBuild(message: string /* , queryRunner?: QueryRunner */): any {
    if (!this.isLoggerEnabled) return;

    /* istanbul ignore next */
    this.event.debug?.(LoggerEvent.SCHEMA_BUILD, {
      message,
    });
  }
  /**
   * Logs events from the migrations run process.
   */
  logMigration(message: string /* , queryRunner?: QueryRunner */): any {
    if (!this.isLoggerEnabled) return;

    /* istanbul ignore next */
    this.event.debug?.(LoggerEvent.DEBUG, {
      message,
    });
  }
  /**
   * Perform logging using given logger, or by default to the console.
   * Log has its own level and message.
   */
  log(
    level: 'log' | 'info' | 'warn',
    message: any,
    // queryRunner?: QueryRunner,
  ): any {
    if (!this.isLoggerEnabled) return;

    switch (level) {
      case 'log':
        /* istanbul ignore next */
        this.event.log?.(LoggerEvent.LOG, {
          message,
        });
        break;
      case 'info':
        /* istanbul ignore next */
        this.event.verbose?.(LoggerEvent.INFO, {
          message,
        });
        break;
      case 'warn':
        /* istanbul ignore next */
        this.event.warn?.(LoggerEvent.WARN, {
          message,
        });
        break;
    }
  }
}
