# YalcEventService

The YalcEventService is a service class that provides methods to handle event logging and emitting in a NestJS application using various methods including error handling with different HTTP status codes.

Please read the [EventModule](./event-manager-module.md) documentation for more information on the module that can be used to instantiate the service class.

Also, it might be useful to read the [Logger](./logger.md) and [Errors](./errors.md) documentation to understand how these 2 components work since they are used in the event-manager library.

## Usage

Import the YalcEventService class from its module and inject it into your service or controller through NestJS's dependency injection mechanism.

```typescript
import { YalcEventService } from '@nestjs-yalc/event-manager';
```

### Constructor

The YalcEventService constructor takes in three parameters:

- loggerService: ImprovedLoggerService - The logger service to handle logging functionalities.
- eventEmitter: EventEmitter2 - Event emitter for emitting events.
- options?: IEventServiceOptions<TFormatter> - Optional parameter for providing service options.

### Properties

- logger: ImprovedLoggerService - Provides access to the logger service.
- emitter: EventEmitter2 - Provides access to the event emitter.
- emit - Alias for the log method.

### Methods

#### Logging and Event Emitting

- log and logAsync: Used for logging events synchronously and asynchronously respectively.
- error and errorAsync: Used to log errors synchronously and asynchronously respectively.
- warn and warnAsync: Used to log warnings synchronously and asynchronously respectively.
- debug and debugAsync: Used to log debug events synchronously and asynchronously respectively.
- verbose and verboseAsync: Used to log verbose events synchronously and asynchronously respectively.

All the above methods accept the following parameters:

- eventName: Parameters<TFormatter> | string - The name of the event to log.
- options?: IEventOptions<TFormatter> - Optional parameter to provide event options.

#### Error Handling Methods

The following methods are used to throw HTTP errors with various status codes, aiding in semantic error handling:

- errorBadRequest: Throws a 400 Bad Request error.
- errorUnauthorized: Throws a 401 Unauthorized error.
  ... (shortened for brevity)

### Helper Methods

- buildOptions: A protected method used internally to merge method options with the constructor options.

### Examples

```typescript
event.log('user_signup', { detail: 'A new user signed up.' });
```

```typescript
event.errorNotFound('resource_not_found', {
  detail: 'The requested resource could not be found.',
});
```

### Note

Ensure to catch errors thrown by these methods in a try-catch block in your application to handle them appropriately.
The emit method is an alias to the log method and can be used interchangeably.
