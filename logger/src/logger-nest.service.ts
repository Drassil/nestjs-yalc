import { ConsoleLogger } from '@nestjs/common';
import { LogMethodOptions } from './logger-abstract.service';
import { maskDataInObject } from './logger.helper';

export class ImprovedNestLogger extends ConsoleLogger {
  log(message: any): void;
  log(message: any, ...optionalParams: any[]): void;
  log(
    message: unknown,
    options?: LogMethodOptions,
    ...rest: unknown[]
  ): void {
    const masked = maskDataInObject(options?.data, options?.masks);
    super.log(
      message + (masked ? `\n${JSON.stringify(masked, null, 2)}` : ''),
      options?.context ?? this.context,
      ...rest,
    );
  }

  error(
    message: any,
    stack?: string | undefined,
,
  ): void;
  error(message: any, ...optionalParams: any[]): void;
  error(
    message: unknown,
    stack?: unknown,
    options?: LogMethodOptions,
    ...rest: unknown[]
  ): void {
    const masked = maskDataInObject(options?.data, options?.masks);
    super.error(
      message + (masked ? `\n${JSON.stringify(masked, null, 2)}` : ''),
      stack,
      options?.context ?? this.context,
      ...rest,
    );
  }

  debug(message: any): void;
  debug(message: any, ...optionalParams: any[]): void;
  debug(
    message: unknown,
    options?: LogMethodOptions,
    ...rest: unknown[]
  ): void {
    const masked = maskDataInObject(options?.data, options?.masks);
    super.debug(
      message + (masked ? `\n${JSON.stringify(masked, null, 2)}` : ''),
      options?.context ?? this.context,
      ...rest,
    );
  }

  verbose(message: any): void;
  verbose(message: any, ...optionalParams: any[]): void;
  verbose(
    message: unknown,
    options?: LogMethodOptions,
    ...rest: unknown[]
  ): void {
    const masked = maskDataInObject(options?.data, options?.masks);
    super.verbose(
      message + (masked ? `\n${JSON.stringify(masked, null, 2)}` : ''),
      options?.context ?? this.context,
      ...rest,
    );
  }

  warn(message: any): void;
  warn(message: any, ...optionalParams: any[]): void;
  warn(
    message: unknown,
    options?: LogMethodOptions,
    ...rest: unknown[]
  ): void {
    const masked = maskDataInObject(options?.data, options?.masks);
    super.warn(
      message + (masked ? `\n${JSON.stringify(masked, null, 2)}` : ''),
      options?.context ?? this.context,
      ...rest,
    );
  }
}
