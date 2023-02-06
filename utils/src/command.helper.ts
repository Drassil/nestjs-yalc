/**
 * It captures errors from the command line and exits the process
 *
 * @param command
 * @returns
 */
export const commandWithErrors = (
  command: (...args: any[]) => Promise<void>,
) => {
  return async (...args: any[]) => {
    try {
      await command(...args);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      process.exit(1);
    }
  };
};
