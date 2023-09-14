/* istanbul ignore file */

import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ErrorsEnum } from './error.enum.js';
import { DefaultErrorMixin, IDefaultErrorOptions } from './default.error.js';

/**
 * Use when the request could not be understood or was missing required parameters.
 */
export class BadRequestError extends DefaultErrorMixin(BadRequestException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      options ?? {},
      message
        ? `${ErrorsEnum.BAD_REQUEST}: ${message}`
        : ErrorsEnum.BAD_REQUEST,
    );
  }
}

/**
 * Use when authentication failed or the user does not have permissions for the desired action.
 */
export class UnauthorizedError extends DefaultErrorMixin(
  UnauthorizedException,
) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      options ?? {},
      message
        ? `${ErrorsEnum.UNAUTHORIZED}: ${message}`
        : ErrorsEnum.UNAUTHORIZED,
    );
  }
}

/**
 * Use when the authenticated user does not have access to the requested resource.
 */
export class ForbiddenError extends DefaultErrorMixin(ForbiddenException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      options ?? {},
      message ? `${ErrorsEnum.FORBIDDEN}: ${message}` : ErrorsEnum.FORBIDDEN,
    );
  }
}

/**
 * Use when the requested resource could not be found.
 */
export class NotFoundError extends DefaultErrorMixin(NotFoundException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      options ?? {},
      message ? `${ErrorsEnum.NOT_FOUND}: ${message}` : ErrorsEnum.NOT_FOUND,
    );
  }
}

/**
 * Use when the request could not be completed due to a conflict with the current state of the target resource.
 */
export class ConflictError extends DefaultErrorMixin(ConflictException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      options ?? {},
      message ? `${ErrorsEnum.CONFLICT}: ${message}` : ErrorsEnum.CONFLICT,
    );
  }
}

/**
 * Use when an unexpected error occurred on the server side.
 */
export class InternalServerError extends DefaultErrorMixin(
  InternalServerErrorException,
) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      options ?? {},
      message
        ? `${ErrorsEnum.INTERNAL_SERVER_ERROR}: ${message}`
        : ErrorsEnum.INTERNAL_SERVER_ERROR,
    );
  }
}

// The following classes are based on HTTP statuses not covered by NestJS built-in exceptions

/**
 * Reserved for future use; its utilization is not common.
 */
export class PaymentRequiredError extends DefaultErrorMixin(HttpException) {
  constructor(options: IDefaultErrorOptions) {
    super(options, ErrorsEnum.PAYMENT_REQUIRED, HttpStatus.PAYMENT_REQUIRED);
  }
}

/**
 * Use when an unsupported HTTP method was used for the request.
 */
export class MethodNotAllowedError extends DefaultErrorMixin(HttpException) {
  constructor(options: IDefaultErrorOptions) {
    super(
      options,
      ErrorsEnum.METHOD_NOT_ALLOWED,
      HttpStatus.METHOD_NOT_ALLOWED,
    );
  }
}

/**
 * Use when the server cannot produce a response matching the list of acceptable values defined in the request's headers.
 */
export class NotAcceptableError extends DefaultErrorMixin(HttpException) {
  constructor(options: IDefaultErrorOptions) {
    super(options, ErrorsEnum.NOT_ACCEPTABLE, HttpStatus.NOT_ACCEPTABLE);
  }
}

/**
 * Use when the requested resource has been permanently deleted and will not be available again.
 */
export class GoneError extends DefaultErrorMixin(HttpException) {
  constructor(options: IDefaultErrorOptions) {
    super(options, ErrorsEnum.GONE, HttpStatus.GONE);
  }
}

/**
 * Use when the request entity has a media type which the server or resource does not support.
 */
export class UnsupportedMediaTypeError extends DefaultErrorMixin(
  HttpException,
) {
  constructor(options: IDefaultErrorOptions) {
    super(
      options,
      ErrorsEnum.UNSUPPORTED_MEDIA_TYPE,
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    );
  }
}

/**
 * Use when the server understands the content type of the request entity, but was unable to process the contained instructions.
 */
export class UnprocessableEntityError extends DefaultErrorMixin(HttpException) {
  constructor(options: IDefaultErrorOptions) {
    super(
      options,
      ErrorsEnum.UNPROCESSABLE_ENTITY,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * Use when the user has sent too many requests in a given amount of time ("rate limiting").
 */
export class TooManyRequestsError extends DefaultErrorMixin(HttpException) {
  constructor(options: IDefaultErrorOptions) {
    super(options, ErrorsEnum.TOO_MANY_REQUESTS, HttpStatus.TOO_MANY_REQUESTS);
  }
}

/**
 * Use when the server does not support the functionality required to fulfill the request.
 */
export class NotImplementedError extends DefaultErrorMixin(HttpException) {
  constructor(options: IDefaultErrorOptions) {
    super(options, ErrorsEnum.NOT_IMPLEMENTED, HttpStatus.NOT_IMPLEMENTED);
  }
}

/**
 * Use when the server, while acting as a gateway or proxy, received an invalid response from the upstream server.
 */
export class BadGatewayError extends DefaultErrorMixin(HttpException) {
  constructor(options: IDefaultErrorOptions) {
    super(options, ErrorsEnum.BAD_GATEWAY, HttpStatus.BAD_GATEWAY);
  }
}

/**
 * Use when the server is currently unavailable (because it is overloaded or down for maintenance).
 */
export class ServiceUnavailableError extends DefaultErrorMixin(HttpException) {
  constructor(options: IDefaultErrorOptions) {
    super(
      options,
      ErrorsEnum.SERVICE_UNAVAILABLE,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/**
 * Use when the server, while acting as a gateway or proxy, did not receive a timely response from the upstream server or some other auxiliary server.
 */
export class GatewayTimeoutError extends DefaultErrorMixin(HttpException) {
  constructor(options: IDefaultErrorOptions) {
    super(options, ErrorsEnum.GATEWAY_TIMEOUT, HttpStatus.GATEWAY_TIMEOUT);
  }
}

/**
 * Custom
 */

export class AdditionalVerificationNeededException extends DefaultErrorMixin(
  HttpException,
) {
  constructor(options: IDefaultErrorOptions) {
    super(
      options,
      'Further verification is required for access.',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class LoginError extends DefaultErrorMixin(UnauthorizedException) {
  constructor(message?: string, options?: IDefaultErrorOptions | string) {
    const systemMessage =
      typeof options === 'string' ? options : options?.systemMessage;
    const _message = message ?? systemMessage ?? ErrorsEnum.BAD_LOGIN;
    super(options ?? _message, _message);
  }
}

export class InputValidationError extends DefaultErrorMixin(
  BadRequestException,
) {
  // There is no default message for this error because in this case
  // who is implementing the validation should be able to give detailed
  // informations for the client on why the input validation failed.
  constructor(message: string, options?: string | IDefaultErrorOptions) {
    super(options ?? {}, message);
  }
}
