# DefaultError Class

This library provides an enhanced Error class that extends the built-in Error functionality with features like a system message that is not returned back to the user,
logging of the error at the moment it's thrown, event triggering for application reactivity during error occurrences,
and defining a data object that can be logged with the message and masked.
This mixin approach retains the original error class, allowing compatibility with NestJS exception filters and differentiation of errors by type.

## Constants

- `ON_DEFAULT_ERROR_EVENT`: The event name for default errors.

## Interfaces

The module exports two interfaces:

- `IAbstractDefaultError`: Extends the `Error` class with additional properties `data` and `systemMessage`.

- `IDefaultErrorOptions`: Specifies options for the default error class. It includes the following properties:

  - `data`: An optional property that can be of any type. This property is used to specify additional data related to the error that will be logged but not thrown back to the user.
  - `masks`: An optional array of strings. These strings represent keys in the data object that should be masked in the logs for privacy or security reasons.
  - `logger`: This property can either be an instance of the `ImprovedLoggerService` or a boolean. If set to true, the default logger (console) is used. If an instance of `ImprovedLoggerService` is provided, it will be used for logging.
  - `systemMessage`: An optional string that represents a message that will be logged in the system but not returned to the user.
  - `eventEmitter`: This can be an instance of either `EventEmitter2` or `EventEmitter`. It will be used to emit an event when an error occurs.

## Methods

- `newDefaultError`: A convenience function that creates a new `DefaultError` class instance extending the provided base class. It takes three parameters: a base class, options, and additional arguments.
- `DefaultErrorMixin`: A function that returns a class extending from the provided base class (or the `Error` class if no base class is provided), with the `IAbstractDefaultError` interface. This class can accept options and parameters in its constructor, handles logging, and emits an event on error occurrence.

## Types
- `DefaultErrorMixin`: A type alias for the `Mixin` of the `DefaultErrorMixin` function.

## Classes

`DefaultError`: An exported class that extends the `DefaultErrorMixin` class and provides a constructor with optional parameters for a message and options for both the extended `DefaultError` and the base error class.

## Usage

```typescript
// Using IDefaultErrorOptions
const options: IDefaultErrorOptions = {
  data: { username: 'john', password: 'password' },
  masks: ['password'],
  logger: true,
  systemMessage: 'System error',
  eventEmitter: myEventEmitter,
};
```

### 1. DefaultError class

Using DefaultError class, this will throw an error based on the native Error class
but with the additional features of the DefaultError class

```typescript
throw new DefaultError('Something went wrong', options);
```

### 2. newDefaultError function

This allows us to choose the base class for the error, in this case UnauthorizedException

```typescript
throw newDefaultError(UnauthorizedException, options, 'Login failed');
```

### 3. DefaultErrorMixin function

This allows us to create a custom error class that is a mixin of the DefaultError class
and extends the UnauthorizedException class. You can use this class to implement your own logic
around the error handling, for example, to add additional properties or methods.

```typescript
class MyCustomError extends DefaultErrorMixin(UnauthorizedException) {
  constructor(message: string, options?: IDefaultErrorOptions) {
    super(options ?? {}, message);
  }
}

throw new MyCustomError('Login failed', options);
```
