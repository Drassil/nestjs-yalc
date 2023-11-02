import { HttpStatusCodes } from '@nestjs-yalc/utils/http.helper.js';
import { httpStatusCodeToErrors } from '../http-status-code-to-errors.js';
import {
  BadRequestError,
  GatewayTimeoutError,
  NotFoundError,
} from '../error.class.js';
import { describe, expect, it } from '@jest/globals';

describe('should test ', () => {
  it('should return not found error when given code 404', () => {
    const httpCode: HttpStatusCodes = 404;
    const result = httpStatusCodeToErrors[httpCode];
    expect(result).toBe(NotFoundError);
  });
  it('should return bad request error when given code 400', () => {
    const httpCode: HttpStatusCodes = 400;
    const result = httpStatusCodeToErrors[httpCode];
    expect(result).toBe(BadRequestError);
  });
  it('should return gateway timeout error when given code 504', () => {
    const httpCode: HttpStatusCodes = 504;
    const result = httpStatusCodeToErrors[httpCode];
    expect(result).toBe(GatewayTimeoutError);
  });
});
