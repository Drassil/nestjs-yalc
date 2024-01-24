import { EventEmitter2 } from '@nestjs/event-emitter';

let eventEmitter: EventEmitter2;

export const yalcStaticEventEmitter = new EventEmitter2({
  maxListeners: 1000,
});

export function getYalcGlobalEventEmitter() {
  if (!eventEmitter) eventEmitter = yalcStaticEventEmitter;

  return eventEmitter;
}

export function setYalcGlobalEventEmitter(
  _eventEmitter: EventEmitter2,
  { skipTransfer = false } = {},
) {
  if (!skipTransfer) {
    transferListeners(eventEmitter, _eventEmitter);
  }

  eventEmitter = _eventEmitter;
}

export function transferListeners(from: EventEmitter2, to: EventEmitter2) {
  from.eventNames().forEach((eventName) => {
    from.listeners(eventName).forEach((listener) => {
      to.on(eventName, listener);
      from.off(eventName, listener);
    });
  });
}
