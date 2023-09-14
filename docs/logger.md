## Logger Service Factory

The `LoggerServiceFactory` is a function that returns a `FactoryProvider` for NestJS, facilitating the creation of an `ImprovedLoggerService` instance tailored to the app's specific configurations. This function takes several parameters including the app alias, a string to provide the logger service, the logging context, and a customizable options object.

Also, it might be useful to read the [Event](./event-manager-event.md) documentation to understand how this component work since it used in the logger library.

### Parameters

- **appAlias**: A string representing the alias of the app.
- **provide**: A string defining what to provide with the factory.
- **context**: A string representing the context in which the logger will be used.
- **options**: An `IImprovedLoggerOptions` object allowing you to customize the logger service settings further.

### Internal Operations

Within the `useFactory` function, configurations are derived from the `config` service using the provided context. The `loggerType` and `loggerLevels` are deduced based on the context and the configuration values. Event emitting behavior is determined by the `options` parameter, using the NestJS event emitter as a fallback if not specified.

Here's how the configuration selection works in detail:

1. The `context` parameter is used to derive the log levels from the configuration service.
2. `loggerLevels` are defined based on the `logContextLevels` for the given context found in the configuration. If no levels are defined for the context, it falls back to the general `logLevels` defined in the configuration.
3. The `loggerType` is acquired from the `conf` object derived from the app configuration service.

### Base Configuration Factory

To adequately configure the logger, it is crucial to set up the base configuration properly. The `BaseConfFactory` function helps in creating a configuration object according to your environment settings and preferences.

The function takes an `IConfFactoryOptions` object as a parameter and returns a configuration object with various properties, including those pertinent to logging, such as `loggerType`, `logLevels`, and `logContextLevels`.

#### Determining Logger Levels

- **From Environment Variables**: Logger levels can be derived from environment variables, allowing for dynamic logging level configurations. The `getEnvLoggerLevels` function assists in obtaining the logger levels from environment variables using the context and a default log level array.
- **From Default Levels**: If no environment variables are set for logger levels, it falls back to using the `LOG_LEVEL_DEFAULT` values.

#### Setting up Context-specific Logger Levels

The `logContextLevels` object in the configuration can have keys representing different contexts, and values being an array of `LogLevel` elements defining the log levels for that context. This object is constructed using a forEach loop on `options.logContextLevels`, where for each context, the logger levels are obtained using `getEnvLoggerLevels` function, providing a dynamic way to set logger levels for different contexts based on environment variables.

#### Environment and Stage Handling

The configuration also handles different environments and stages, defining properties that help determine the current stage and whether it belongs to local or development stages. Error handling is included to ensure a valid stage is selected.

#### Base-App: Default loggers and specific ones

If you are utilizing the @nestjs-yalc/app library, it's beneficial to understand that the base-app module is already equipped with a provider and integrates the `YalcDefaultAppModule`, which automatically configures two default loggers: the `SYSTEM_LOGGER_SERVICE` that is globally accessible across all modules, and the `APP_LOGGER_SERVICE` which is scoped to individual application modules.

Here is how it works:

### Default Loggers

1. **SYSTEM_LOGGER_SERVICE**: This logger is global, making it available for every module in your application.
2. **APP_LOGGER_SERVICE**: This logger is injected into each application module, scoping it to that module.

While these default loggers are designed to meet most of your logging needs, there could be instances where you would want to instantiate new logger providers distinct from the default ones. This is feasible and is done by differentiating the context and its configuration settings.

Creating new logger providers can be highly beneficial, particularly when you aim to develop loggers for specific services and wish to dynamically tune their configuration without affecting the default loggers.

#### Creating New Logger Providers

To create new logger providers, differentiate the context and its configuration settings as explained earlier. This allows for dynamic tuning of configurations specific to a service without altering the default settings.

This feature is mainly used to:

- Generate loggers for specific services.
- Dynamically adjust configurations without influencing the default ones.

Feel free to explore this setup to create more intricate and detailed logging services for your applications, optimizing control and insights into your app's operations and performance.

### Usage

Here is how to use the `LoggerServiceFactory` to create a logger service instance:

```typescript
import { LoggerServiceFactory } from '@nestjs-yalc/logger';

const loggerService = LoggerServiceFactory(
  'myApp',
  'MyLoggerService',
  'MyContext',
  { event: { eventEmitter: myEventEmitter } },
);
```

### Examples

You would integrate `LoggerServiceFactory` in your NestJS application as a provider. Here is a succinct example:

```typescript
import { LoggerServiceFactory } from '@nestjs-yalc/logger';

@Module({
  providers: [
    LoggerServiceFactory('myApp', 'MyLoggerService', 'MyContext', {
      event: { eventEmitter: myEventEmitter },
    }),
  ],
})
export class MyModule {}
```

## Utilizing the Logger Services

Once the `ImprovedLoggerService` is instantiated via the `LoggerServiceFactory`, it can be injected into other services, controllers, or components in your NestJS application to facilitate logging. Below, we'll cover how to leverage the `log` and `error` methods of the logger service for logging messages and handling errors, respectively.

### Logging Messages

The `log` method can be used to log standard messages. Here is how you can use this method:

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class MyService {
  constructor(private readonly logger: ImprovedLoggerService) {}

  myMethod() {
    this.logger.log('This is a log message', 'MyService');
  }
}
```

In the above example, `'This is a log message'` is the message that will be logged, and `'MyService'` is the context in which the log is being made. The context is optional but can be useful to indicate the part of the application from which the log originates.

### Handling Errors

The `error` method can be utilized to log error messages. It can take several parameters, including a message string, a trace string, and a context string. Here is how you can use this method:

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class MyService {
  constructor(private readonly logger: ImprovedLoggerService) {}

  myErrorMethod() {
    try {
      // Some operation that can throw an error
    } catch (error) {
      this.logger.error('An error occurred', error.stack, 'MyService');
    }
  }
}
```

In this scenario:

- `'An error occurred'` is the error message to be logged.
- `error.stack` is used to log the stack trace of the error (if available).
- `'MyService'` indicates the context in which the error occurred.

### Recommendations

- **Contextual Logging**: Leveraging the context parameter in both the `log` and `error` methods can assist in filtering logs based on different contexts, providing a clearer insight into the behavior of your application.
- **Structured Logging**: Consider structuring your logs in a manner that facilitates easier querying, such as using JSON format for your log messages.
- **Error Handling**: Use try-catch blocks to gracefully handle errors and log detailed error information, aiding in diagnosing issues efficiently.

Understanding and utilizing the `log` and `error` methods of the `ImprovedLoggerService` is essential in creating a robust logging strategy for your NestJS application. Remember to leverage the context parameter and maintain a structured logging format for a more insightful and efficient logging experience.

## Conclusion

With the `LoggerServiceFactory` and `BaseConfFactory`, you can set up a dynamic logging system adapted to different contexts and environments. It facilitates context-aware logging configurations, leveraging environment variables for heightened configurability. Ensure to structure your environment variables and contexts appropriately to make the most out of this system.
