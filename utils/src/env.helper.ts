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

export function envIsTrue(value: string) {
  const val = value.toLowerCase();
  return val === 'true' || val === '1' || val === 'on';
}
