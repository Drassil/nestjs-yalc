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
  TOO_MANY_REQUESTS = 'Too many requests', // 429

  // 500 Server Errors
  INTERNAL_SERVER_ERROR = 'Internal server error', // 500
  NOT_IMPLEMENTED = 'Not implemented', // 501
  BAD_GATEWAY = 'Bad gateway', // 502
  SERVICE_UNAVAILABLE = 'Service unavailable', // 503
  GATEWAY_TIMEOUT = 'Gateway timeout', // 504
}

export enum ExceptionContextEnum {
  DATABASE = 'DatabaseException',
  HTTP = 'HttpException',
  SYSTEM = 'SystemException',
}
