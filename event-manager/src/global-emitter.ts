import { EventEmitter2 } from '@nestjs/event-emitter';

let eventEmitter: EventEmitter2;

export const yalcStaticEventEmitter = new EventEmitter2({
  maxListeners: 1000,
});

export function getYalcGlobalEventEmitter() {
  if (!eventEmitter) eventEmitter = yalcStaticEventEmitter;

  return eventEmitter;
}

/**
 * Do not use this function unless you know what you are doing.
 */
export function setYalcGlobalEventEmitter(_eventEmitter: EventEmitter2) {
  eventEmitter = _eventEmitter;
}
