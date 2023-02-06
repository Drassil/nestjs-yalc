import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import {
  HttpException,
  ArgumentsHost,
  Catch,
  LoggerService,
  UnauthorizedException,
} from '@nestjs/common';
import {
  LoginError,
  MissingArgumentsError,
  UnauthorizedError,
} from '@nestjs-yalc/errors';
import { ExceptionContextEnum } from '../errors.enum.js';
import { EntityError } from '@nestjs-yalc/crud-gen/entity.error.js';
import { FastifyReply as FResponse } from 'fastify';
import { GqlError } from '@nestjs-yalc/graphql/plugins/gql.error.js';
import { BadRequestError } from '../input-validation.error.js';

type HttpErrorType =
  | HttpException
  | LoginError
  | MissingArgumentsError
  | UnauthorizedError
  | GqlError
  | BadRequestError;
@Catch(
  HttpException,
  LoginError,
  MissingArgumentsError,
  UnauthorizedError,
  GqlError,
  BadRequestError,
)
export class HttpExceptionFilter implements GqlExceptionFilter {
  constructor(private logger: LoggerService) {}

  catch(error: Error | HttpErrorType, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);

    // TODO: Validate when monitoring is in place if we need an eventEmitter here instead of log
    switch (true) {
      // Base logging for normal operation execution errors
      case error instanceof MissingArgumentsError:
      case error instanceof UnauthorizedError:
      case error instanceof UnauthorizedException: // Thrown by NestJS Auth Guard
      case error instanceof LoginError:
      case error instanceof BadRequestError:
        this.logger.log(
          (<LoginError>error).systemMessage ?? error.message,
          error.stack,
          ExceptionContextEnum.HTTP,
        );
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

      // Log critically any other error, as those are not expected
      default:
        this.logger.error(error, error.stack, ExceptionContextEnum.HTTP);
        break;
    }

    if (gqlHost.getType() === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<FResponse>();
      const status = (error as HttpException).getStatus();
      return response.status(status).send((error as any).response);
    }
    return error;
  }
}
