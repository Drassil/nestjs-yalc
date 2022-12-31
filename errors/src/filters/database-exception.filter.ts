import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import {
  ArgumentsHost,
  Catch,
  InternalServerErrorException,
  LoggerService,
} from '@nestjs/common';
// We can import more errors from the typeorm/error folder if necessary, nothing is exported though, so use explicit paths.
import { EntityNotFoundError, ConnectionNotFoundError } from 'typeorm';
import { ExceptionContextEnum } from '../errors.enum';

@Catch(EntityNotFoundError, ConnectionNotFoundError)
export class DatabaseExceptionFilter implements GqlExceptionFilter {
  constructor(private logger: LoggerService) {}

  catch(error: Error, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    gqlHost.getType();

    // Normally transactions are for performance monitoring,
    // Op and Name reflect which operation and function we are running
    // Could not get issue tracking working without, using exception filter as op.
    // const transaction = Sentry.startTransaction({
    //   op: 'DatabaseExceptionFilter', // operation (encode)
    //   name: 'Caught Error', // name (parseAvatarImage)
    // });

    // TODO: Validate when monitoring is in place if we need an eventEmitter here instead of log
    switch (true) {
      // Re-throw a new 500 HTTP-friendly error
      // Add more TypeORM errors here, because there's no base Error class
      // @url: https://github.com/typeorm/typeorm/issues/3479
      case error instanceof EntityNotFoundError:
        this.logger.error(error, ExceptionContextEnum.DATABASE);
        error = new InternalServerErrorException(error);
        // Sentry.captureException(error);
        break;
      // Log critically any other error, because those are not expected normally
      default:
        this.logger.error(error, error.stack, ExceptionContextEnum.DATABASE);
        // Sentry.captureException(error);
        break;
    }
    // transaction.finish();

    return error;
  }
}
