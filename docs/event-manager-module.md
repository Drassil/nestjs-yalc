# YalcEventModule

The `YalcEventModule` is a module class that integrates various services including logging and event emitting functionalities in a NestJS application, leveraging the utilities from several other libraries and modules.

Please read the [YalcEventService](./event-manager-service.md) documentation for more information on the service class and to learn how to use it.

## Usage

To use the `YalcEventModule`, import it from its module file and use it in your NestJS application. The module offers a `forRootAsync` method to setup and configure it asynchronously.

```typescript
import { EventModule } from 'path-to-your-module-file';
```

## Methods

### forRootAsync

A static method that helps in configuring the module with various options. It accepts two parameters:

- `options?: IEventModuleOptions<TFormatter>`
- `optionProvider?: Provider<IProviderOptions>`

This method integrates various providers and configurations into the module, setting up an ecosystem for event logging and emitting.

## Examples

Below are examples on how you would be using this module in a NestJS application:

### Setting up with Default Options

```typescript
EventModule.forRootAsync();
```

### Setting up with Custom Options

```typescript
EventModule.forRootAsync({
  loggerProvider: {
    context: 'MyContext',
  },
  eventEmitter: myEventEmitterProvider,
});
```
