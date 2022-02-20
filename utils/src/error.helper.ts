/**
 * If the argument of the function is an instance of Error the function throw it,
 * else it throw a new error instance
 * @throws a wrapped error, avoiding a double wrap of the error
 */
export function throwWrap(error: any): never {
  if (error instanceof Error) {
    throw error;
  } else {
    throw new Error(error as string);
  }
}
