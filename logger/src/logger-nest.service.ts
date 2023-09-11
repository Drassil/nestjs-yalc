import { ConsoleLogger, ConsoleLoggerOptions } from '@nestjs/common';
import {
  IImprovedLoggerOptions,
  ILoggerPluginMethods,
  ImprovedLoggerService,
  LogMethodOptions,
  beforeLogging,
} from './logger-abstract.service.js';
import { maskDataInObject } from './logger.helper.js';
import { WithPluginSystem } from '@nestjs-yalc/utils/plugin.helper.js';

export class ImprovedNestLogger
  extends WithPluginSystem<ILoggerPluginMethods>(ConsoleLogger)
  implements ImprovedLoggerService
{
  constructor(
    context: string,
    options: ConsoleLoggerOptions,
    protected _options: IImprovedLoggerOptions = {},
  ) {
    super(context, options);
  }

  private getOptions(options: LogMethodOptions | any) {
    return typeof options === 'string' ? {} : options;
  }

  log(message: any): void;
  log(message: any, ...optionalParams: any[]): void;
  log(
    message: unknown,
    options: LogMethodOptions = {},
    ...rest: unknown[]
  ): void {
    const _options = this.getOptions(options);

    this.beforeLogging(message, _options);

    const masked = maskDataInObject(
      _options.data,
      _options.masks,
      _options.trace,
    );
    super.log(
      message + (masked ? `\n${JSON.stringify(masked, null, 2)}` : ''),
      _options.context ?? this.context,
      ...rest,
    );
  }

  error(message: any, stack?: string | undefined): void;
  error(message: any, ...optionalParams: any[]): void;
  error(
    message: unknown,
    stack?: unknown,
    options: LogMethodOptions = {},
    ...rest: unknown[]
  ): void {
    const _options = this.getOptions(options);
    this.beforeLogging(message, _options);

    const masked = maskDataInObject(_options.data, _options.masks);
    super.error(
      message + (masked ? `\n${JSON.stringify(masked, null, 2)}` : ''),
      stack,
      _options.context ?? this.context,
      ...rest,
    );
  }

  debug(message: any): void;
  debug(message: any, ...optionalParams: any[]): void;
  debug(
    message: unknown,
    options: LogMethodOptions = {},
    ...rest: unknown[]
  ): void {
    const _options = this.getOptions(options);
    this.beforeLogging(message, _options);

    const masked = maskDataInObject(
      _options.data,
      _options.masks,
      _options.trace,
    );
    super.debug(
      message + (masked ? `\n${JSON.stringify(masked, null, 2)}` : ''),
      _options.context ?? this.context,
      ...rest,
    );
  }

  verbose(message: any): void;
  verbose(message: any, ...optionalParams: any[]): void;
  verbose(
    message: unknown,
    options: LogMethodOptions = {},
    ...rest: unknown[]
  ): void {
    const _options = this.getOptions(options);
    this.beforeLogging(message, _options);

    const masked = maskDataInObject(
      _options.data,
      _options.masks,
      _options.trace,
    );
    super.verbose(
      message + (masked ? `\n${JSON.stringify(masked, null, 2)}` : ''),
      _options.context ?? this.context,
      ...rest,
    );
  }

  warn(message: any): void;
  warn(message: any, ...optionalParams: any[]): void;
  warn(
    message: unknown,
    options: LogMethodOptions = {},
    ...rest: unknown[]
  ): void {
    const _options = this.getOptions(options);
    this.beforeLogging(message, _options);

    const masked = maskDataInObject(
      _options.data,
      _options.masks,
      _options.trace,
    );
    super.warn(
      message + (masked ? `\n${JSON.stringify(masked, null, 2)}` : ''),
      _options.context ?? this.context,
      ...rest,
    );
  }

  beforeLogging(message: any, options: LogMethodOptions) {
    this.options.event = this.options.event ?? {};
    this.invokePlugins('onBeforeLogging', message, options);
    void beforeLogging(message, options);
  }
}
