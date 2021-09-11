/* istanbul ignore file */

type EnvObj = { [key: string]: string };

/**
 *  Used as a helper to make jest tests cleaner when working with process.env
 */
export function envTestHelper(env?: EnvObj) {
  const OLD_ENV = process.env;

  if (env) {
    process.env = env;
  }

  return {
    build(env: EnvObj) {
      process.env = env;
    },

    getEnv() {
      return process.env;
    },

    getEnvValue(key: string) {
      return process.env[key];
    },

    setEnv(key: string, value: string) {
      process.env[key] = value;
    },

    reset() {
      process.env = OLD_ENV;
    },
  };
}
