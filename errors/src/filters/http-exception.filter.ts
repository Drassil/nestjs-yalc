import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import * as common from '@nestjs/common';
import {
  DefaultErrorMixin,
  MissingArgumentsError,
  isDefaultErrorMixin,
} from '@nestjs-yalc/errors';
import { ExceptionContextEnum } from '../error.enum.js';
import { EntityError } from '@nestjs-yalc/crud-gen/entity.error.js';
import { FastifyReply as FResponse } from 'fastify';
import { GqlError } from '@nestjs-yalc/graphql/plugins/gql.error.js';

type HttpErrorType =
  | common.HttpException
  | MissingArgumentsError
  | GqlError
  | DefaultErrorMixin;
@common.Catch(
  common.HttpException,
  MissingArgumentsError,
  GqlError,
  DefaultErrorMixin,
)
export class HttpExceptionFilter implements GqlExceptionFilter {
  constructor(private logger: common.LoggerService) {}

  catch(error: Error | HttpErrorType, host: common.ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);

    // TODO: Validate when monitoring is in place if we need an eventEmitter here instead of log
    switch (true) {
      // Base logging for normal operation execution errors
      case error instanceof MissingArgumentsError:
      case error instanceof common.UnauthorizedException: // Thrown by NestJS Auth Guard
        this.logger.log(error.message, error.stack, ExceptionContextEnum.HTTP);
        break;

      // Log original error message (for now only if is an EntityError)
      case error instanceof EntityError:
        const entityError = error as EntityError;
        this.logger.error(
          entityError.originalError?.message
            ? entityError.originalError.message
            : error,
          ExceptionContextEnum.HTTP,
        );
        break;

      case error instanceof GqlError:
        this.logger.error((<GqlError>error).systemMessage ?? error.message);
        break;

      case isDefaultErrorMixin(error):
        // no need to log, DefaultErrorMixin already logs
        break;

      // Log critically any other error, as those are not expected
      default:
        this.logger.error(error, error.stack, ExceptionContextEnum.HTTP);
        break;
    }

    if (gqlHost.getType() === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<FResponse>();
      const status = (error as common.HttpException).getStatus();
      return response.status(status).send((error as any).response);
    }
    return error;
  }
}
