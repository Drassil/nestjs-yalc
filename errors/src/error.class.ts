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
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.BAD_REQUEST}: ${internalMessage}`
        : ErrorsEnum.BAD_REQUEST,
      { ...(options ?? {}), errorCode: HttpStatus.BAD_REQUEST },
    );
  }
}

/**
 * Use when authentication failed or the user does not have permissions for the desired action.
 */
export class UnauthorizedError extends DefaultErrorBase(UnauthorizedException) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.UNAUTHORIZED}: ${internalMessage}`
        : ErrorsEnum.UNAUTHORIZED,
      { ...(options ?? {}), errorCode: HttpStatus.UNAUTHORIZED },
    );
  }
}

/**
 * Use when the authenticated user does not have access to the requested resource.
 */
export class ForbiddenError extends DefaultErrorBase(ForbiddenException) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.FORBIDDEN}: ${internalMessage}`
        : ErrorsEnum.FORBIDDEN,
      { ...(options ?? {}), errorCode: HttpStatus.FORBIDDEN },
    );
  }
}

/**
 * Use when the requested resource could not be found.
 */
export class NotFoundError extends DefaultErrorBase(NotFoundException) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.NOT_FOUND}: ${internalMessage}`
        : ErrorsEnum.NOT_FOUND,
      { ...(options ?? {}), errorCode: HttpStatus.NOT_FOUND },
    );
  }
}

/**
 * Use when the request could not be completed due to a conflict with the current state of the target resource.
 */
export class ConflictError extends DefaultErrorBase(ConflictException) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.CONFLICT}: ${internalMessage}`
        : ErrorsEnum.CONFLICT,
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
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.INTERNAL_SERVER_ERROR}: ${internalMessage}`
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
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.PAYMENT_REQUIRED}: ${internalMessage}`
        : ErrorsEnum.PAYMENT_REQUIRED,
      { ...(options ?? {}), errorCode: HttpStatus.PAYMENT_REQUIRED },
    );
  }
}

/**
 * Use when an unsupported HTTP method was used for the request.
 */
export class MethodNotAllowedError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.METHOD_NOT_ALLOWED}: ${internalMessage}`
        : ErrorsEnum.METHOD_NOT_ALLOWED,
      { ...(options ?? {}), errorCode: HttpStatus.METHOD_NOT_ALLOWED },
    );
  }
}

/**
 * Use when the server cannot produce a response matching the list of acceptable values defined in the request's headers.
 */
export class NotAcceptableError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.NOT_ACCEPTABLE}: ${internalMessage}`
        : ErrorsEnum.NOT_ACCEPTABLE,
      { ...(options ?? {}), errorCode: HttpStatus.NOT_ACCEPTABLE },
    );
  }
}

/**
 * Use when the requested resource has been permanently deleted and will not be available again.
 */
export class GoneError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.GONE}: ${internalMessage}`
        : ErrorsEnum.GONE,
      {
        ...(options ?? {}),
        errorCode: HttpStatus.GONE,
      },
    );
  }
}

/**
 * Use when the request entity has a media type which the server or resource does not support.
 */
export class UnsupportedMediaTypeError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.UNSUPPORTED_MEDIA_TYPE}: ${internalMessage}`
        : ErrorsEnum.UNSUPPORTED_MEDIA_TYPE,
      { ...(options ?? {}), errorCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE },
    );
  }
}

/**
 * Use when the server understands the content type of the request entity, but was unable to process the contained instructions.
 */
export class UnprocessableEntityError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.UNPROCESSABLE_ENTITY}: ${internalMessage}`
        : ErrorsEnum.UNPROCESSABLE_ENTITY,
      { ...(options ?? {}), errorCode: HttpStatus.UNPROCESSABLE_ENTITY },
    );
  }
}

/**
 * Use when the user has sent too many requests in a given amount of time ("rate limiting").
 */
export class TooManyRequestsError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.TOO_MANY_REQUESTS}: ${internalMessage}`
        : ErrorsEnum.TOO_MANY_REQUESTS,
      { ...(options ?? {}), errorCode: HttpStatus.TOO_MANY_REQUESTS },
    );
  }
}

/**
 * Use when the server does not support the functionality required to fulfill the request.
 */
export class NotImplementedError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.NOT_IMPLEMENTED}: ${internalMessage}`
        : ErrorsEnum.NOT_IMPLEMENTED,
      { ...(options ?? {}), errorCode: HttpStatus.NOT_IMPLEMENTED },
    );
  }
}

/**
 * Use when the server, while acting as a gateway or proxy, received an invalid response from the upstream server.
 */
export class BadGatewayError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.BAD_GATEWAY}: ${internalMessage}`
        : ErrorsEnum.BAD_GATEWAY,
      { ...(options ?? {}), errorCode: HttpStatus.BAD_GATEWAY },
    );
  }
}

/**
 * Use when the server is currently unavailable (because it is overloaded or down for maintenance).
 */
export class ServiceUnavailableError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.SERVICE_UNAVAILABLE}: ${internalMessage}`
        : ErrorsEnum.SERVICE_UNAVAILABLE,
      { ...(options ?? {}), errorCode: HttpStatus.SERVICE_UNAVAILABLE },
    );
  }
}

/**
 * Use when the server, while acting as a gateway or proxy, did not receive a timely response from the upstream server or some other auxiliary server.
 */
export class GatewayTimeoutError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.GATEWAY_TIMEOUT}: ${internalMessage}`
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
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `Further verification is required for access: ${internalMessage}`
        : 'Further verification is required for access',
      { ...(options ?? {}), errorCode: HttpStatus.UNPROCESSABLE_ENTITY },
    );
  }
}

export class LoginError extends DefaultErrorBase(UnauthorizedException) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(
      internalMessage
        ? `${ErrorsEnum.BAD_LOGIN}: ${internalMessage}`
        : ErrorsEnum.BAD_LOGIN,
      { ...(options ?? {}), errorCode: HttpStatus.UNAUTHORIZED },
    );
  }
}

export class InputValidationError extends DefaultErrorBase(
  BadRequestException,
) {
  constructor(internalMessage?: string, options?: IDefaultErrorOptions) {
    super(internalMessage, {
      ...(options ?? {}),
      errorCode: HttpStatus.BAD_REQUEST,
    });
  }
}
