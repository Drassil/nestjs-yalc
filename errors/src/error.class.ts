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
  HttpExceptionOptions,
} from '@nestjs/common';
import { ErrorsEnum } from './error.enum.js';
import { DefaultErrorBase, IDefaultErrorBaseOptions } from './default.error.js';
import { HttpStatusCode } from 'axios';

function buildArgs(
  errorName: ErrorsEnum,
  internalMessage?: string,
  options?: IDefaultErrorBaseOptions,
): [
  string,
  IDefaultErrorBaseOptions,
  string | object | any,
  string | HttpExceptionOptions,
] {
  const { cause, description, response, ...restOptions } = options ?? {};
  return [
    internalMessage ? `${errorName}: ${internalMessage}` : errorName,
    { ...(restOptions ?? {}), description },
    response ?? {},
    {
      cause,
      description,
    },
  ];
}

function buildArgsHttpException(
  errorName: ErrorsEnum,
  internalMessage?: string,
  options?: IDefaultErrorBaseOptions,
  errorCode?: HttpStatus | HttpStatusCode,
): [
  string,
  IDefaultErrorBaseOptions,
  string | object | any,
  number,
  HttpExceptionOptions,
] {
  const args = buildArgs(errorName, internalMessage, options);
  return [
    args[0],
    args[1],
    args[2],
    errorCode ?? HttpStatus.INTERNAL_SERVER_ERROR,
    typeof args[3] === 'string' ? { description: args[3] } : args[3],
  ];
}

/**
 * Use when the request could not be understood or was missing required parameters.
 */
export class BadRequestError extends DefaultErrorBase(BadRequestException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(...buildArgs(ErrorsEnum.BAD_REQUEST, internalMessage, options));
  }
}

/**
 * Use when authentication failed or the user does not have permissions for the desired action.
 */
export class UnauthorizedError extends DefaultErrorBase(UnauthorizedException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(...buildArgs(ErrorsEnum.UNAUTHORIZED, internalMessage, options));
  }
}

/**
 * Use when the authenticated user does not have access to the requested resource.
 */
export class ForbiddenError extends DefaultErrorBase(ForbiddenException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(...buildArgs(ErrorsEnum.FORBIDDEN, internalMessage, options));
  }
}

/**
 * Use when the requested resource could not be found.
 */
export class NotFoundError extends DefaultErrorBase(NotFoundException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(...buildArgs(ErrorsEnum.NOT_FOUND, internalMessage, options));
  }
}

/**
 * Use when the request could not be completed due to a conflict with the current state of the target resource.
 */
export class ConflictError extends DefaultErrorBase(ConflictException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(...buildArgs(ErrorsEnum.CONFLICT, internalMessage, options));
  }
}

/**
 * Use when an unexpected error occurred on the server side.
 */
export class InternalServerError extends DefaultErrorBase(
  InternalServerErrorException,
) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(
      ...buildArgs(ErrorsEnum.INTERNAL_SERVER_ERROR, internalMessage, options),
    );
  }
}

// The following classes are based on HTTP statuses not covered by NestJS built-in exceptions

/**
 * Reserved for future use; its utilization is not common.
 */
export class PaymentRequiredError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(
      ...buildArgsHttpException(
        ErrorsEnum.PAYMENT_REQUIRED,
        internalMessage,
        options,
        HttpStatus.PAYMENT_REQUIRED,
      ),
    );
  }
}

/**
 * Use when an unsupported HTTP method was used for the request.
 */
export class MethodNotAllowedError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(
      ...buildArgsHttpException(
        ErrorsEnum.METHOD_NOT_ALLOWED,
        internalMessage,
        options,
        HttpStatus.METHOD_NOT_ALLOWED,
      ),
    );
  }
}

/**
 * Use when the server cannot produce a response matching the list of acceptable values defined in the request's headers.
 */
export class NotAcceptableError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(
      ...buildArgsHttpException(
        ErrorsEnum.NOT_ACCEPTABLE,
        internalMessage,
        options,
        HttpStatus.NOT_ACCEPTABLE,
      ),
    );
  }
}

/**
 * Use when the requested resource has been permanently deleted and will not be available again.
 */
export class GoneError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(
      ...buildArgsHttpException(
        ErrorsEnum.GONE,
        internalMessage,
        options,
        HttpStatus.GONE,
      ),
    );
  }
}

/**
 * Use when the request entity has a media type which the server or resource does not support.
 */
export class UnsupportedMediaTypeError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(
      ...buildArgsHttpException(
        ErrorsEnum.UNSUPPORTED_MEDIA_TYPE,
        internalMessage,
        options,
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      ),
    );
  }
}

/**
 * Use when the server understands the content type of the request entity, but was unable to process the contained instructions.
 */
export class UnprocessableEntityError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(
      ...buildArgsHttpException(
        ErrorsEnum.UNPROCESSABLE_ENTITY,
        internalMessage,
        options,
        HttpStatus.UNPROCESSABLE_ENTITY,
      ),
    );
  }
}

/**
 * Use when the user has sent too many requests in a given amount of time ("rate limiting").
 */
export class TooManyRequestsError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(
      ...buildArgsHttpException(
        ErrorsEnum.TOO_MANY_REQUESTS,
        internalMessage,
        options,
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );
  }
}

/**
 * Use when the server does not support the functionality required to fulfill the request.
 */
export class NotImplementedError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(
      ...buildArgsHttpException(
        ErrorsEnum.NOT_IMPLEMENTED,
        internalMessage,
        options,
        HttpStatus.NOT_IMPLEMENTED,
      ),
    );
  }
}

/**
 * Use when the server, while acting as a gateway or proxy, received an invalid response from the upstream server.
 */
export class BadGatewayError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(
      ...buildArgsHttpException(
        ErrorsEnum.BAD_GATEWAY,
        internalMessage,
        options,
        HttpStatus.BAD_GATEWAY,
      ),
    );
  }
}

/**
 * Use when the server is currently unavailable (because it is overloaded or down for maintenance).
 */
export class ServiceUnavailableError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(
      ...buildArgsHttpException(
        ErrorsEnum.SERVICE_UNAVAILABLE,
        internalMessage,
        options,
        HttpStatus.SERVICE_UNAVAILABLE,
      ),
    );
  }
}

/**
 * Use when the server, while acting as a gateway or proxy, did not receive a timely response from the upstream server or some other auxiliary server.
 */
export class GatewayTimeoutError extends DefaultErrorBase(HttpException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(
      ...buildArgsHttpException(
        ErrorsEnum.GATEWAY_TIMEOUT,
        internalMessage,
        options,
        HttpStatus.GATEWAY_TIMEOUT,
      ),
    );
  }
}

/**
 * Custom
 */

export class AdditionalVerificationNeededException extends DefaultErrorBase(
  HttpException,
) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(
      ...buildArgsHttpException(
        ErrorsEnum.UNAVAILABLE_FOR_LEGAL_REASONS,
        internalMessage,
        options,
        HttpStatusCode.UnavailableForLegalReasons,
      ),
    );
  }
}

export class LoginError extends DefaultErrorBase(UnauthorizedException) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(...buildArgs(ErrorsEnum.BAD_LOGIN, internalMessage, options));
  }
}

export class InputValidationError extends DefaultErrorBase(
  BadRequestException,
) {
  constructor(internalMessage?: string, options?: IDefaultErrorBaseOptions) {
    super(...buildArgs(ErrorsEnum.INVALID_VALUE, internalMessage, options));
  }
}
