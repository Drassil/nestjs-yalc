/* istanbul ignore file */

import type { Faker } from '@faker-js/faker';

export type FactoryType<T = any> = (faker: Faker) => T;
