import { HttpStatus } from '@nestjs/common';
import {
  BadGatewayError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  GatewayTimeoutError,
  GoneError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  NotImplementedError,
  PaymentRequiredError,
  ServiceUnavailableError,
  TooManyRequestsError,
  UnauthorizedError,
  UnprocessableEntityError,
  UnsupportedMediaTypeError,
} from './error.class.js';
import { HttpStatusCodes } from '@nestjs-yalc/utils/http.helper.js';

export enum ErrorsEnum {
  // 400 Client Errors
  BAD_REQUEST = 'Bad request', // 400
  INVALID_VALUE = 'Invalid value', // 400 (custom)

  UNAUTHORIZED = 'Unauthorized', // 401

  BAD_LOGIN = 'Bad login', // 401 (custom, usually used for unauthorized access with wrong credentials)

  PAYMENT_REQUIRED = 'Payment required', // 402
  FORBIDDEN = 'Forbidden', // 403
  FORBIDDEN_RESOURCE = 'Forbidden resource', // 403 (custom)
  NOT_FOUND = 'Not found', // 404
  METHOD_NOT_ALLOWED = 'Method not allowed', // 405
  NOT_ACCEPTABLE = 'Not acceptable', // 406
  CONFLICT = 'Conflict', // 409
  GONE = 'Gone', // 410
  UNSUPPORTED_MEDIA_TYPE = 'Unsupported media type', // 415
  UNPROCESSABLE_ENTITY = 'Unprocessable entity', // 422
  UNAVAILABLE_FOR_LEGAL_REASONS = 'Unavailable for legal reasons', // 451
  TOO_MANY_REQUESTS = 'Too many requests', // 429

  // 500 Server Errors
  INTERNAL_SERVER_ERROR = 'Internal server error', // 500
  NOT_IMPLEMENTED = 'Not implemented', // 501
  BAD_GATEWAY = 'Bad gateway', // 502
  SERVICE_UNAVAILABLE = 'Service unavailable', // 503
  GATEWAY_TIMEOUT = 'Gateway timeout', // 504
}

export const getHttpStatusNameByCode = (code: number): string => {
  const httpStatusEnumName = Object.entries(HttpStatus).find(
    ([, value]) => value === code,
  )?.[0];
  const enumValue = ErrorsEnum[httpStatusEnumName as keyof typeof ErrorsEnum];
  return enumValue ?? 'Unknown';
};

export enum ExceptionContextEnum {
  DATABASE = 'DatabaseException',
  HTTP = 'HttpException',
  SYSTEM = 'SystemException',
}

export const httpStatusCodeToErrors: {
  [key in HttpStatusCodes]?: any;
} = {
  [HttpStatus.BAD_REQUEST]: BadRequestError,
  [HttpStatus.UNAUTHORIZED]: UnauthorizedError,
  [HttpStatus.FORBIDDEN]: ForbiddenError,
  [HttpStatus.NOT_FOUND]: NotFoundError,
  [HttpStatus.CONFLICT]: ConflictError,
  [HttpStatus.INTERNAL_SERVER_ERROR]: InternalServerError,
  [HttpStatus.PAYMENT_REQUIRED]: PaymentRequiredError,
  [HttpStatus.METHOD_NOT_ALLOWED]: MethodNotAllowedError,
  [HttpStatus.GONE]: GoneError,
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: UnsupportedMediaTypeError,
  [HttpStatus.UNPROCESSABLE_ENTITY]: UnprocessableEntityError,
  [HttpStatus.TOO_MANY_REQUESTS]: TooManyRequestsError,
  [HttpStatus.NOT_IMPLEMENTED]: NotImplementedError,
  [HttpStatus.BAD_GATEWAY]: BadGatewayError,
  [HttpStatus.SERVICE_UNAVAILABLE]: ServiceUnavailableError,
  [HttpStatus.GATEWAY_TIMEOUT]: GatewayTimeoutError,
};
