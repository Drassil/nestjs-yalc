import { EventEmitter2 } from '@nestjs/event-emitter';
import { maskDataInObject } from '@nestjs-yalc/logger/logger.helper.js';

export type EventNameFormatter = (...args: any[]) => string;

export interface IEventEmitterOptions<TFormatter extends EventNameFormatter> {
  formatter?: TFormatter;
  mask?: string[];
  await?: boolean;
}

export async function emitEvent<TFormatter extends EventNameFormatter>(
  eventEmitter: EventEmitter2,
  name: Parameters<TFormatter>,
  payload: any,
  options?: IEventEmitterOptions<TFormatter>,
) {
  const data = options?.mask
    ? maskDataInObject(payload, options.mask)
    : payload;

  const _name = options?.formatter?.(...name) ?? name.join();

  return await (options?.await ? eventEmitter.emitAsync : eventEmitter.emit)(
    _name,
    data,
  );
}

export function emitFormattedEvent<TFormatter extends EventNameFormatter>(
  eventEmitter: EventEmitter2,
  name: string,
  payload: any,
  options?: IEventEmitterOptions<TFormatter>,
) {
  return emitEvent(eventEmitter, [name], payload, {
    ...options,
    formatter: simpleFormatter,
  });
}

export type VersionedDomainActionFormatter = (
  version: string,
  context: string,
  action: string,
  when: string,
) => string;

export const versionedDomainActionFormatter: VersionedDomainActionFormatter = (
  version: string,
  context: string,
  action: string,
  when: string,
) => {
  return `${version}.${context}.${action}.${when}`;
};

export type SimpleFormatter = (action: string) => string;

export const simpleFormatter: SimpleFormatter = (action: string) => {
  return `on${action}`;
};
