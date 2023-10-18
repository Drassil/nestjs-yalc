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
import { DefaultErrorBase, IDefaultErrorOptions } from './default.error.js';

/**
 * Use when the request could not be understood or was missing required parameters.
 */
export class BadRequestError extends DefaultErrorBase(BadRequestException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message
        ? `${ErrorsEnum.BAD_REQUEST}: ${message}`
        : ErrorsEnum.BAD_REQUEST,
      { ...(options ?? {}), errorCode: HttpStatus.BAD_REQUEST },
    );
  }
}

/**
 * Use when authentication failed or the user does not have permissions for the desired action.
 */
export class UnauthorizedError extends DefaultErrorBase(UnauthorizedException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message
        ? `${ErrorsEnum.UNAUTHORIZED}: ${message}`
        : ErrorsEnum.UNAUTHORIZED,
      { ...(options ?? {}), errorCode: HttpStatus.UNAUTHORIZED },
    );
  }
}

/**
 * Use when the authenticated user does not have access to the requested resource.
 */
export class ForbiddenError extends DefaultErrorBase(ForbiddenException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message ? `${ErrorsEnum.FORBIDDEN}: ${message}` : ErrorsEnum.FORBIDDEN,
      { ...(options ?? {}), errorCode: HttpStatus.FORBIDDEN },
    );
  }
}

/**
 * Use when the requested resource could not be found.
 */
export class NotFoundError extends DefaultErrorBase(NotFoundException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message ? `${ErrorsEnum.NOT_FOUND}: ${message}` : ErrorsEnum.NOT_FOUND,
      { ...(options ?? {}), errorCode: HttpStatus.NOT_FOUND },
    );
  }
}

/**
 * Use when the request could not be completed due to a conflict with the current state of the target resource.
 */
export class ConflictError extends DefaultErrorBase(ConflictException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message ? `${ErrorsEnum.CONFLICT}: ${message}` : ErrorsEnum.CONFLICT,
      { ...(options ?? {}), errorCode: HttpStatus.CONFLICT },
    );
  }
}

/**
 * Use when an unexpected error occurred on the server side.
 */
export class InternalServerError extends DefaultErrorBase(
  InternalServerErrorException,
) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message
        ? `${ErrorsEnum.INTERNAL_SERVER_ERROR}: ${message}`
        : ErrorsEnum.INTERNAL_SERVER_ERROR,
      { ...(options ?? {}), errorCode: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}

// The following classes are based on HTTP statuses not covered by NestJS built-in exceptions

/**
 * Reserved for future use; its utilization is not common.
 */
export class PaymentRequiredError extends DefaultErrorBase(HttpException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message
        ? `${ErrorsEnum.PAYMENT_REQUIRED}: ${message}`
        : ErrorsEnum.PAYMENT_REQUIRED,
      { ...(options ?? {}), errorCode: HttpStatus.PAYMENT_REQUIRED },
    );
  }
}

/**
 * Use when an unsupported HTTP method was used for the request.
 */
export class MethodNotAllowedError extends DefaultErrorBase(HttpException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message
        ? `${ErrorsEnum.METHOD_NOT_ALLOWED}: ${message}`
        : ErrorsEnum.METHOD_NOT_ALLOWED,
      { ...(options ?? {}), errorCode: HttpStatus.METHOD_NOT_ALLOWED },
    );
  }
}

/**
 * Use when the server cannot produce a response matching the list of acceptable values defined in the request's headers.
 */
export class NotAcceptableError extends DefaultErrorBase(HttpException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message
        ? `${ErrorsEnum.NOT_ACCEPTABLE}: ${message}`
        : ErrorsEnum.NOT_ACCEPTABLE,
      { ...(options ?? {}), errorCode: HttpStatus.NOT_ACCEPTABLE },
    );
  }
}

/**
 * Use when the requested resource has been permanently deleted and will not be available again.
 */
export class GoneError extends DefaultErrorBase(HttpException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(message ? `${ErrorsEnum.GONE}: ${message}` : ErrorsEnum.GONE, {
      ...(options ?? {}),
      errorCode: HttpStatus.GONE,
    });
  }
}

/**
 * Use when the request entity has a media type which the server or resource does not support.
 */
export class UnsupportedMediaTypeError extends DefaultErrorBase(HttpException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message
        ? `${ErrorsEnum.UNSUPPORTED_MEDIA_TYPE}: ${message}`
        : ErrorsEnum.UNSUPPORTED_MEDIA_TYPE,
      { ...(options ?? {}), errorCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE },
    );
  }
}

/**
 * Use when the server understands the content type of the request entity, but was unable to process the contained instructions.
 */
export class UnprocessableEntityError extends DefaultErrorBase(HttpException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message
        ? `${ErrorsEnum.UNPROCESSABLE_ENTITY}: ${message}`
        : ErrorsEnum.UNPROCESSABLE_ENTITY,
      { ...(options ?? {}), errorCode: HttpStatus.UNPROCESSABLE_ENTITY },
    );
  }
}

/**
 * Use when the user has sent too many requests in a given amount of time ("rate limiting").
 */
export class TooManyRequestsError extends DefaultErrorBase(HttpException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message
        ? `${ErrorsEnum.TOO_MANY_REQUESTS}: ${message}`
        : ErrorsEnum.TOO_MANY_REQUESTS,
      { ...(options ?? {}), errorCode: HttpStatus.TOO_MANY_REQUESTS },
    );
  }
}

/**
 * Use when the server does not support the functionality required to fulfill the request.
 */
export class NotImplementedError extends DefaultErrorBase(HttpException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message
        ? `${ErrorsEnum.NOT_IMPLEMENTED}: ${message}`
        : ErrorsEnum.NOT_IMPLEMENTED,
      { ...(options ?? {}), errorCode: HttpStatus.NOT_IMPLEMENTED },
    );
  }
}

/**
 * Use when the server, while acting as a gateway or proxy, received an invalid response from the upstream server.
 */
export class BadGatewayError extends DefaultErrorBase(HttpException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message
        ? `${ErrorsEnum.BAD_GATEWAY}: ${message}`
        : ErrorsEnum.BAD_GATEWAY,
      { ...(options ?? {}), errorCode: HttpStatus.BAD_GATEWAY },
    );
  }
}

/**
 * Use when the server is currently unavailable (because it is overloaded or down for maintenance).
 */
export class ServiceUnavailableError extends DefaultErrorBase(HttpException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message
        ? `${ErrorsEnum.SERVICE_UNAVAILABLE}: ${message}`
        : ErrorsEnum.SERVICE_UNAVAILABLE,
      { ...(options ?? {}), errorCode: HttpStatus.SERVICE_UNAVAILABLE },
    );
  }
}

/**
 * Use when the server, while acting as a gateway or proxy, did not receive a timely response from the upstream server or some other auxiliary server.
 */
export class GatewayTimeoutError extends DefaultErrorBase(HttpException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message
        ? `${ErrorsEnum.GATEWAY_TIMEOUT}: ${message}`
        : ErrorsEnum.GATEWAY_TIMEOUT,
      { ...(options ?? {}), errorCode: HttpStatus.GATEWAY_TIMEOUT },
    );
  }
}

/**
 * Custom
 */

export class AdditionalVerificationNeededException extends DefaultErrorBase(
  HttpException,
) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message
        ? `Further verification is required for access: ${message}`
        : 'Further verification is required for access',
      { ...(options ?? {}), errorCode: HttpStatus.UNPROCESSABLE_ENTITY },
    );
  }
}

export class LoginError extends DefaultErrorBase(UnauthorizedException) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(
      message ? `${ErrorsEnum.BAD_LOGIN}: ${message}` : ErrorsEnum.BAD_LOGIN,
      { ...(options ?? {}), errorCode: HttpStatus.UNAUTHORIZED },
    );
  }
}

export class InputValidationError extends DefaultErrorBase(
  BadRequestException,
) {
  constructor(message?: string, options?: IDefaultErrorOptions) {
    super(message, { ...(options ?? {}), errorCode: HttpStatus.BAD_REQUEST });
  }
}
