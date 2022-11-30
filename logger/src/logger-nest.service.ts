import { ConsoleLogger } from '@nestjs/common';
import { LogMethodOptions } from './logger-abstract.service';
import { maskDataInObject } from './logger.helper';

export class ImprovedNestLogger extends ConsoleLogger {
  log(message: any, context?: string | undefined): void;
  log(message: any, ...optionalParams: any[]): void;
  log(
    message: unknown,
    context?: string,
    options?: LogMethodOptions,
    ...rest: unknown[]
  ): void {
    const masked = maskDataInObject(options?.data, options?.masks);
    super.log(
      message + (masked ? `\n${JSON.stringify(masked, null, 2)}` : ''),
      context ?? this.context,
      ...rest,
    );
  }

  error(
    message: any,
    stack?: string | undefined,
    context?: string | undefined,
  ): void;
  error(message: any, ...optionalParams: any[]): void;
  error(
    message: unknown,
    stack?: unknown,
    context?: string,
    options?: LogMethodOptions,
    ...rest: unknown[]
  ): void {
    const masked = maskDataInObject(options?.data, options?.masks);
    super.error(
      message + (masked ? `\n${JSON.stringify(masked, null, 2)}` : ''),
      stack,
      context ?? this.context,
      ...rest,
    );
  }

  debug(message: any, context?: string | undefined): void;
  debug(message: any, ...optionalParams: any[]): void;
  debug(
    message: unknown,
    context?: string,
    options?: LogMethodOptions,
    ...rest: unknown[]
  ): void {
    const masked = maskDataInObject(options?.data, options?.masks);
    super.debug(
      message + (masked ? `\n${JSON.stringify(masked, null, 2)}` : ''),
      context ?? this.context,
      ...rest,
    );
  }

  verbose(message: any, context?: string | undefined): void;
  verbose(message: any, ...optionalParams: any[]): void;
  verbose(
    message: unknown,
    context?: string,
    options?: LogMethodOptions,
    ...rest: unknown[]
  ): void {
    const masked = maskDataInObject(options?.data, options?.masks);
    super.verbose(
      message + (masked ? `\n${JSON.stringify(masked, null, 2)}` : ''),
      context ?? this.context,
      ...rest,
    );
  }

  warn(message: any, context?: string | undefined): void;
  warn(message: any, ...optionalParams: any[]): void;
  warn(
    message: unknown,
    context?: string,
    options?: LogMethodOptions,
    ...rest: unknown[]
  ): void {
    const masked = maskDataInObject(options?.data, options?.masks);
    super.warn(
      message + (masked ? `\n${JSON.stringify(masked, null, 2)}` : ''),
      context ?? this.context,
      ...rest,
    );
  }
}
