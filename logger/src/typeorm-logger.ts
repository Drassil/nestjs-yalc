import { LoggerService } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from 'typeorm';
import { LoggerEvent } from './logger.event';

export class TypeORMLogger implements Logger {
  constructor(
    private logger: LoggerService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Logs query and parameters used in it.
   */
  logQuery(
    query: string,
    parameters?: any[] /*, queryRunner?: QueryRunner*/,
  ): any {
    this.eventEmitter.emitAsync(LoggerEvent.QUERY_LOG, query);
    this.logger.debug?.(`query: ${query}, parameters: ${parameters}`);
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
    this.eventEmitter.emitAsync(LoggerEvent.QUERY_ERROR, query, error);
    this.logger.error?.(
      `error: ${error}, query: ${query}, parameters: ${parameters}`,
    );
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
    this.eventEmitter.emitAsync(LoggerEvent.QUERY_SLOW, query, time);
    this.logger.warn?.(
      `SLOW QUERY!!!! time: ${time}, query: ${query}, parameters: ${parameters}`,
    );
  }
  /**
   * Logs events from the schema build process.
   */
  logSchemaBuild(message: string /* , queryRunner?: QueryRunner */): any {
    this.logger.debug?.(message);
  }
  /**
   * Logs events from the migrations run process.
   */
  logMigration(message: string /* , queryRunner?: QueryRunner */): any {
    this.logger.debug?.(message);
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
    switch (level) {
      case 'log':
        this.logger.log?.(message);
        break;
      case 'info':
        this.logger.verbose?.(message);
        break;
      case 'warn':
        this.logger.warn?.(message);
        break;
    }
  }
}
