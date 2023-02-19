/* istanbul ignore file */

import type { Faker } from "@faker-js/faker";

export type ClassType<T = any> = new (...args: any[]) => T;
export type FactoryType<T = any> = (faker: Faker) => T;
