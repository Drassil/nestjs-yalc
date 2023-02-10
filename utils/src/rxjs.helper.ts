import { AnyFunction } from '@nestjs-yalc/types/globals.js';
import {
  combineLatest,
  MonoTypeOperatorFunction,
  ObservableInput,
  of,
  EMPTY,
  from,
  isObservable,
  Observable,
  UnaryFunction,
} from 'rxjs';
import { map, mergeMap, switchMap } from 'rxjs/operators';
import util from 'node:util';

/**
 * Wraps any value into an observable.
 *
 * - If the input is an Observable, the input is returned directly.
 * - If the input is a Promise, it is converted to an Observable.
 * - If the input is `null` or `undefined` an empty Observable is returned.
 * - Otherwise the input is simply wrapped into an Observable.
 *
 * @param input Input which will be wrapped into an Observable.
 * @returns Observable which wraps the input.
 */
export function wrapIntoObservable<T>(
  input: Promise<T> | Observable<T> | T | void,
): Observable<T> {
  if (input === null || input === undefined) {
    return EMPTY;
  }

  if (util.types.isAsyncFunction(input)) {
    return from(input as Promise<T>);
  }

  if (isObservable(input)) {
    return input;
  }

  return of(input as any);
}

export function wrapIntoAnOperator(
  input: AnyFunction,
): UnaryFunction<any, any> {
  if (util.types.isAsyncFunction(input)) {
    return mergeMap(input);
  }

  return input;
}

/**
 * Behaves exactly like `switchMap`, except that it maps all values back to the initial value.
 * @param project Projection function which returns the inner observable.
 */
export function switchTap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
): MonoTypeOperatorFunction<T> {
  return (input) =>
    input.pipe(
      switchMap((value, index) =>
        combineLatest([of(value), project(value, index)]),
      ),
      map(([intialValue]) => intialValue),
    );
}
