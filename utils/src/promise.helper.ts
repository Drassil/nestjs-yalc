import * as pMap from "p-map";

export const PROMISE_CONCURRENCY_LIMIT = 1000;

/**
 * This method allows you to run multiple async functions concurrently. It's an alternative to the Promise.all native method
 * with support to concurrency limit. It's an adapter of the p-map library.
 * NOTE: concurrency is set to 1000 by default and stopOnError = true
 * 
@param input - Iterated over concurrently in the `mapper` function.
@param mapper - Function which is called for every item in `input`. Expected to return a `Promise` or value.
@returns A `Promise` that is fulfilled when all promises in `input` and ones returned from `mapper` are fulfilled, or rejects if any of the promises reject. The fulfilled value is an `Array` of the fulfilled values returned from `mapper` in `input` order.
*/
export function promiseMap<Element, NewElement>(
  input: Iterable<Element>,
  mapper: pMap.Mapper<Element, NewElement>,
  options?: pMap.Options
): Promise<NewElement[]> {
  return pMap(input, mapper, {
    concurrency: options?.concurrency ?? PROMISE_CONCURRENCY_LIMIT,
    stopOnError: options?.stopOnError ?? true,
  });
}
