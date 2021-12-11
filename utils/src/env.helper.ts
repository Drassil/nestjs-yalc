/**
 * This method can be used to convert a comma separated list of elements from process.env to an array
 * @param key
 */
export const envToArray = <T>(key: string): T[] => {
  // for testing purpose we need to specify only the case of empty string here
  if (process.env[key] === '') return [];

  return (
    <T[]>(<unknown>process.env[key]?.split(',').map((v) => v.trim())) ?? []
  );
};

export function envIsTrue(value?: string) {
  if (!value) return false;

  const val = value.toLowerCase();
  return val === 'true' || val === '1' || val === 'on';
}

/**
 * Check that the current env is in production by
 * checking the explicit case first, and the implicit case after (if requested)
 * @param implicitCheck enable implicit check by default
 * @returns boolean
 */
export function isProduction(implicitCheck = true) {
  return (
    process.env.NODE_ENV === 'production' ||
    (implicitCheck &&
      ['test', 'pipeline', 'development'].every(
        (v) => process.env.NODE_ENV !== v,
      ))
  );
}
