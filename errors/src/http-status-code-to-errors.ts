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
import { HttpStatus } from '@nestjs/common';

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
