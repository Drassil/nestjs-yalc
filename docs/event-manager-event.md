### Documentation

#### Overview

This library is designed to facilitate flexible and configurable event logging in TypeScript. At the heart of it is the `event` function which can handle logging, event emitting, and error generation based on the options provided.
You can easily control the actions performed by the function through a detailed configuration object, making the library highly flexible to adapt to various needs.

Here's how you can leverage the functionalities:

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

The core function of the library, it takes the following parameters:

- **eventName**: The name of the event being logged. It can be a formatted string or parameters for an EventNameFormatter.
- **options**: A configuration object that dictates the behavior of the function. It can contain several properties including data, mask, trace, event, message, logger, and error to finely control the output.

##### Usage Example:

```typescript
import { event } from 'your-library-name';

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

We also offer a set of utility functions derived from the main `event` function but with preset logging levels to streamline the logging process.
These functions accept the same parameters as the `event` function. The roster includes:

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

Each of these utility functions sets a distinct logging level predefined in the options object, described as follows:

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

While it's mainly internal, you can also utilize the `applyAwaitOption` function to set the `await` option in the event options object to true by default.

##### `applyAwaitOption`

```typescript
function applyAwaitOption<
  TFormatter extends EventNameFormatter = EventNameFormatter,
>(options?: IEventOptions<TFormatter>): IEventOptions<TFormatter>;
```
