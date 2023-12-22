import { EventEmitter2 } from '@nestjs/event-emitter';

let eventEmitter: EventEmitter2;

export const yalcStaticEventEmitter = new EventEmitter2({
  maxListeners: 1000,
});

export function getGlobalEventEmitter() {
  if (!eventEmitter) eventEmitter = yalcStaticEventEmitter;

  return eventEmitter;
}

export function setGlobalEventEmitter(_eventEmitter: EventEmitter2) {
  eventEmitter = _eventEmitter;
}
