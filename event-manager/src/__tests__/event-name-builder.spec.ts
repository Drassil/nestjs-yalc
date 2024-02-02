import {
  EventNameBuilder,
  EventType,
  IUtilsProperties,
} from '../event-name-builder.js';
import { describe, it, expect } from '@jest/globals';

class EventV1NameBuilder extends EventNameBuilder {
  static version: IUtilsProperties = { base: 'v1', all: `v1.**` };
}

class EventCustomNameBuilder extends EventNameBuilder {}

describe('EventNameBuilder', () => {
  describe('events', () => {
    it('should generate events with base event and action keys', () => {
      const domain = 'example';

      const expectedEvents = {
        create: {
          base: 'example.create',
          all: 'example.create.**',
          event1: 'example.create.event1',
          event2: 'example.create.event2',
        },
        update: {
          base: 'example.update',
          all: 'example.update.**',
          event3: 'example.update.event3',
          event4: 'example.update.event4',
        },
        base: 'example',
        all: 'example.**',
      };

      const generatedEvents = EventNameBuilder.events(domain, {
        create: {
          event1: EventType,
          event2: EventType,
        },
        update: {
          event3: EventType,
          event4: EventType,
        },
      });

      expect(generatedEvents).toEqual(expectedEvents);
    });

    it('should generate events with base event and action keys for v1', () => {
      const domain = 'example';

      const expectedEvents = {
        create: {
          base: 'v1.example.create',
          all: 'v1.example.create.**',
          event1: 'v1.example.create.event1',
          event2: 'v1.example.create.event2',
        },
        update: {
          base: 'v1.example.update',
          all: 'v1.example.update.**',
          event3: 'v1.example.update.event3',
          event4: 'v1.example.update.event4',
        },
        base: 'v1.example',
        all: 'v1.example.**',
      };

      const generatedEvents = EventV1NameBuilder.events(domain, {
        create: {
          event1: EventType,
          event2: EventType,
        },
        update: {
          event3: EventType,
          event4: EventType,
        },
      });

      expect(generatedEvents).toEqual(expectedEvents);
    });

    it('should generate events with base event and action keys for v1 with no eventType', () =>
      expect(
        EventCustomNameBuilder.events<Record<string, any>>('example', {
          create: { event1: 'custom.domain.event' },
        }),
      ).toEqual(
        expect.objectContaining({
          create: expect.objectContaining({
            event1: 'custom.domain.event',
          }),
        }),
      ));
  });
});
