### Documentation

#### Overview

This TypeScript library facilitates flexible and configurable event logging, aimed at making your event management seamless and effective.
At the heart of it is the `event` function which can handle logging, event emitting, and error generation based on the options provided.
It integrates seamlessly with external tools such as `EventEmitter2`.
You can easily control the actions performed by the function through a detailed configuration object, making the library highly flexible to adapt to various needs.

Below, you will find detailed insights into its core functionalities along with usage examples.

Also, it might be useful to read the [Event Service](./event-manager-service.md) that extends the `event` functions and provides a more convenient way to integrate errors, event logging and emitting in your NestJS application.

#### Main Functions

##### `event`

```typescript
function event<
  TFormatter extends EventNameFormatter = EventNameFormatter,
  TOption extends IEventOptions<TFormatter> = IEventOptions<TFormatter>,
>(
  eventName: Parameters<TFormatter> | string,
  options?: TOption,
): Promise<ReturnType<TOption>> | ReturnType<TOption>;
```

Here's what the core function offers:

- **eventName**: Defines the event to be logged. It accepts a formatted string or parameters for an EventNameFormatter.
- **options**: This optional parameter is a configuration object that dictates the function's behavior, allowing for a detailed control of the output through properties such as data, mask, trace, event, message, logger, and error.

Defaults:

- The function has preset behaviors for when optional parameters are not specified, providing ease of use in simpler scenarios.

**Return Value**: Depending upon the configurations set, it returns a promise or the return type defined in TOption.

##### Usage Example:

```typescript
import { event } from 'your-library-name';
import { EventEmitter2 } from 'eventemitter2';

event('USER_LOGIN', {
  data: { userId: 12345 },
  logger: {
    level: 'log',
  },
  event: {
    emitter: new EventEmitter2(),
  },
});
```

#### Logger Functions

Alongside the main `event` function, we offer a roster of utility functions preset with different logging levels to make the logging process streamlined. These functions accept the same parameters as the `event` function.

- **eventLogAsync**
- **eventLog**
- **eventErrorAsync**
- **eventError**
- **eventWarnAsync**
- **eventWarn**
- **eventDebugAsync**
- **eventDebug**
- **eventVerboseAsync**
- **eventVerbose**

Each function corresponds to a predefined logging level in the options object, simplifying the setting of logging levels:

- `eventLogAsync` and `eventLog`: `LogLevelEnum.LOG`
- `eventErrorAsync` and `eventError`: `LogLevelEnum.ERROR`
- `eventWarnAsync` and `eventWarn`: `LogLevelEnum.WARN`
- `eventDebugAsync` and `eventDebug`: `LogLevelEnum.DEBUG`
- `eventVerboseAsync` and `eventVerbose`: `LogLevelEnum.VERBOSE`

##### Usage Example:

```typescript
import { eventLog, eventError } from 'your-library-name';

eventLog('USER_CREATED', {
  data: { userId: 12345 },
  message: 'User created successfully',
});

throw eventError('USER_CREATION_FAILED', {
  data: { userId: 12345 },
  message: 'User creation failed',
});
```

#### Utility Functions

Primarily internal, the `applyAwaitOption` function allows you to set the `await` option in the event options object to true by default.

##### `applyAwaitOption`

```typescript
function applyAwaitOption<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(options?: IEventOptions<TFormatter>): IEventOptions<TFormatter>;
```

This function takes an optional parameter and returns an IEventOptions object with the `await` option set to true, providing a convenient way to apply asynchronous operations in your event handling logic.
