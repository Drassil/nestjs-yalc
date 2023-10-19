import { HttpStatus, Injectable, LogLevel } from '@nestjs/common';
import {
  eventLogAsync,
  eventDebugAsync,
  eventErrorAsync,
  eventVerboseAsync,
  eventWarnAsync,
  IEventOptions,
  eventDebug,
  eventError,
  eventLog,
  eventVerbose,
  eventWarn,
  applyAwaitOption,
  IErrorEventOptions,
  isErrorOptions,
  IErrorEventOptionsRequired,
} from './event.js';
import { LogLevelEnum, type ImprovedLoggerService } from '@nestjs-yalc/logger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNameFormatter } from './emitter.js';
import { DefaultError } from '@nestjs-yalc/errors/default.error.js';
import {
  BadGatewayError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  GatewayTimeoutError,
  GoneError,
  InternalServerError,
  MethodNotAllowedError,
  NotAcceptableError,
  NotFoundError,
  NotImplementedError,
  PaymentRequiredError,
  ServiceUnavailableError,
  TooManyRequestsError,
  UnauthorizedError,
  UnprocessableEntityError,
  UnsupportedMediaTypeError,
} from '@nestjs-yalc/errors/error.class.js';
import { getLogLevelByStatus } from './event.helper.js';
import { ClassType } from '@nestjs-yalc/types/globals.d.js';

export interface IEventServiceOptions<
  TFormatter extends EventNameFormatter = EventNameFormatter,
> {
  formatter?: TFormatter;
}

@Injectable()
export class YalcEventService<
  TFormatter extends EventNameFormatter = EventNameFormatter,
> {
  constructor(
    protected readonly loggerService: ImprovedLoggerService,
    protected readonly eventEmitter: EventEmitter2,
    protected options?: IEventServiceOptions<TFormatter>,
  ) {}

  get logger(): ImprovedLoggerService {
    return this.loggerService;
  }

  get emitter(): EventEmitter2 {
    return this.eventEmitter;
  }

  /**
   * Alias for log
   */
  emit = this.log;

  public error<TOpts extends IErrorEventOptions<TFormatter>>(
    eventName: Parameters<TFormatter> | string,
    options?: TOpts,
  ) {
    return eventError<TFormatter, TOpts>(
      eventName,
      this.buildOptions<TOpts>(options),
    );
  }

  public async logAsync(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): Promise<any> {
    return eventLogAsync(eventName, this.buildOptions(options));
  }

  public async errorAsync<TOpts extends IErrorEventOptions<TFormatter>>(
    eventName: Parameters<TFormatter> | string,
    options?: TOpts,
  ) {
    return eventErrorAsync<TFormatter, TOpts>(
      eventName,
      this.buildOptions<TOpts>(options),
    );
  }

  public async warnAsync(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): Promise<any> {
    return eventWarnAsync(eventName, this.buildOptions(options));
  }

  public async debugAsync(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): Promise<any> {
    return eventDebugAsync(eventName, this.buildOptions(options));
  }

  public async verboseAsync(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): Promise<any> {
    return eventVerboseAsync(eventName, this.buildOptions(options));
  }

  public log(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): any {
    return eventLog(eventName, this.buildOptions(options));
  }

  public warn(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): any {
    return eventWarn(eventName, this.buildOptions(options));
  }

  public debug(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): any {
    return eventDebug(eventName, this.buildOptions(options));
  }

  public verbose(
    eventName: Parameters<TFormatter> | string,
    options?: IEventOptions<TFormatter>,
  ): any {
    return eventVerbose(eventName, this.buildOptions(options));
  }

  /**
   * Use this method to throw an error with arbitrary status code. 500 by default.
   */
  public errorHttp(
    eventName: Parameters<TFormatter> | string,
    errorCode = HttpStatus.INTERNAL_SERVER_ERROR,
    options?: IErrorEventOptions<TFormatter>,
  ): any {
    const mergedOptions = this.applyLoggerLevel(
      applyAwaitOption(this.buildErrorOptions(options)),
      getLogLevelByStatus(errorCode),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 400 Bad Request error when the request could not be understood or was missing required parameters.
   */
  public errorBadRequest(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): BadRequestError {
    const mergedOptions = this.applyLoggerLevelLog(
      applyAwaitOption(this.buildErrorOptions(options, BadRequestError)),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 401 Unauthorized error when authentication is required and has failed or has not yet been provided.
   */
  public errorUnauthorized(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): UnauthorizedError {
    const mergedOptions = this.applyLoggerLevelLog(
      applyAwaitOption(this.buildErrorOptions(options, UnauthorizedError)),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 402 Payment Required error. This status code is reserved for future use.
   */
  public errorPaymentRequired(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): PaymentRequiredError {
    const mergedOptions = this.applyLoggerLevelLog(
      applyAwaitOption(this.buildErrorOptions(options, PaymentRequiredError)),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 403 Forbidden error when the client does not have access rights to the content.
   */
  public errorForbidden(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): ForbiddenError {
    const mergedOptions = this.applyLoggerLevelLog(
      applyAwaitOption(this.buildErrorOptions(options, ForbiddenError)),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 404 Not Found error when the server can not find the requested resource.
   */
  public errorNotFound(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): NotFoundError {
    const mergedOptions = this.applyLoggerLevelLog(
      applyAwaitOption(this.buildErrorOptions(options, NotFoundError)),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 405 Method Not Allowed error when the HTTP method is not supported for the requested resource.
   */
  public errorMethodNotAllowed(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): MethodNotAllowedError {
    const mergedOptions = this.applyLoggerLevelLog(
      applyAwaitOption(this.buildErrorOptions(options, MethodNotAllowedError)),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 406 Not Acceptable error when the server cannot produce a response matching the list of acceptable values defined in the request's headers.
   */
  public errorNotAcceptable(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): NotAcceptableError {
    const mergedOptions = this.applyLoggerLevelLog(
      applyAwaitOption(this.buildErrorOptions(options, NotAcceptableError)),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 409 Conflict error when the request could not be completed due to a conflict with the current state of the target resource.
   */
  public errorConflict(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): ConflictError {
    const mergedOptions = this.applyLoggerLevelLog(
      applyAwaitOption(this.buildErrorOptions(options, ConflictError)),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 410 Gone error when the target resource is no longer available at the origin server and no forwarding address is known.
   */
  public errorGone(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): GoneError {
    const mergedOptions = this.applyLoggerLevelLog(
      applyAwaitOption(this.buildErrorOptions(options, GoneError)),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 415 Unsupported Media Type error when the request entity has a media type which the server or resource does not support.
   */
  public errorUnsupportedMediaType(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): UnsupportedMediaTypeError {
    const mergedOptions = this.applyLoggerLevelLog(
      applyAwaitOption(
        this.buildErrorOptions(options, UnsupportedMediaTypeError),
      ),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 422 Unprocessable Entity error when the server understands the content type of the request entity, but was unable to process the contained instructions.
   */
  public errorUnprocessableEntity(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): UnprocessableEntityError {
    const mergedOptions = this.applyLoggerLevelLog(
      applyAwaitOption(
        this.buildErrorOptions(options, UnprocessableEntityError),
      ),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 429 Too Many Requests error when the user has sent too many requests in a given amount of time.
   */
  public errorTooManyRequests(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): TooManyRequestsError {
    const mergedOptions = this.applyLoggerLevelWarn(
      applyAwaitOption(this.buildErrorOptions(options, TooManyRequestsError)),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 500 Internal Server Error when the server encountered an unexpected condition that prevented it from fulfilling the request.
   */
  public errorInternalServerError(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): InternalServerError {
    const mergedOptions = applyAwaitOption(
      this.buildErrorOptions(options, InternalServerError),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 501 Not Implemented error when the server does not support the functionality required to fulfill the request.
   */
  public errorNotImplemented(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): NotImplementedError {
    const mergedOptions = applyAwaitOption(
      this.buildErrorOptions(options, NotImplementedError),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 502 Bad Gateway error when one server on the internet received an invalid response from another server.
   */
  public errorBadGateway(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): BadGatewayError {
    const mergedOptions = applyAwaitOption(
      this.buildErrorOptions(options, BadGatewayError),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 503 Service Unavailable error when the server is not ready to handle the request. Common causes are a server that is down for maintenance or that is overloaded.
   */
  public errorServiceUnavailable(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): ServiceUnavailableError {
    const mergedOptions = applyAwaitOption(
      this.buildErrorOptions(options, ServiceUnavailableError),
    );
    return this.error(eventName, mergedOptions);
  }

  /**
   * Use this method to throw a 504 Gateway Timeout error when one server did not receive a timely response from another server or some other auxiliary server it needed to access to complete the request.
   */
  public errorGatewayTimeout(
    eventName: Parameters<TFormatter> | string,
    options?: Omit<IErrorEventOptions<TFormatter>, 'errorClass'>,
  ): any {
    const mergedOptions = applyAwaitOption(
      this.buildErrorOptions(options, GatewayTimeoutError),
    );
    return this.error(eventName, mergedOptions);
  }

  protected applyLoggerLevel<
    TOpt extends IEventOptions<TFormatter> | IErrorEventOptions<TFormatter>,
  >(options: TOpt, level: LogLevel): TOpt {
    if (options?.logger === false) return options;

    return {
      ...options,
      logger: {
        ...options?.logger,
        level,
      },
    } as TOpt;
  }

  protected applyLoggerLevelWarn<
    TOpts extends IErrorEventOptions<TFormatter> | IEventOptions<TFormatter>,
  >(options: TOpts): TOpts {
    return this.applyLoggerLevel(options, LogLevelEnum.WARN);
  }

  protected applyLoggerLevelLog<
    TOpts extends IErrorEventOptions<TFormatter> | IEventOptions<TFormatter>,
  >(options: TOpts): TOpts {
    return this.applyLoggerLevel(options, LogLevelEnum.LOG);
  }

  /**
   * Merges the methods options with the constructor options.
   */
  protected buildOptions<
    TOpts extends IErrorEventOptions<TFormatter> | IEventOptions<TFormatter>,
  >(options?: TOpts): TOpts {
    let _options: TOpts = { ...(options as TOpts) };

    let event: IEventOptions<TFormatter>['event'];
    if (_options?.event !== undefined || this.eventEmitter) {
      event =
        _options.event === false
          ? false
          : {
              ..._options?.event,
              emitter: _options?.event?.emitter ?? this.eventEmitter,
              formatter: _options?.event?.formatter ?? this.options?.formatter,
            };
    }

    if (isErrorOptions(_options)) {
      const errorOptions = _options as IErrorEventOptions;
      errorOptions.errorClass ??= DefaultError;
    }

    const res: IErrorEventOptions<TFormatter> = {
      ..._options,
      event,
      logger:
        _options?.logger === false
          ? false
          : {
              ..._options?.logger,
              instance: this.loggerService,
            },
    };

    return res as TOpts;
  }

  protected buildErrorOptions<TErrorClass extends DefaultError = DefaultError>(
    options: IErrorEventOptions<TFormatter> = {},
    defaultClass: ClassType<TErrorClass> | boolean = true,
  ): IErrorEventOptionsRequired<TFormatter, TErrorClass> {
    options.errorClass ??= defaultClass;
    return this.buildOptions<
      IErrorEventOptionsRequired<TFormatter, TErrorClass>
    >(options as IErrorEventOptionsRequired<TFormatter, TErrorClass>);
  }
}
