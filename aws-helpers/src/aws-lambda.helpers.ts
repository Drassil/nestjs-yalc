/**
 * Helper function to run a CLI command with the exception
 * correctly handled by lambda
 *
 * @param method the function/command to run, remember to bind your parameters
 * @param message the message to return if the command succeeds
 * @returns response
 */
export async function runLambdaCliOperation(
  method: (...args: any) => Promise<void>,
  message: string,
) {
  try {
    await method();
  } catch (error) {
    // apparently the only way to let lambda exit
    // after an error is by catching it here
    // and set a promise rejection. We should investigate why it's happening
    // since it should exit automatically after a thrown error
    Promise.reject(error);

    return {};
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message,
    }),
  };
}
