export const headerWhitelist = ['Authorization'];

export function filterHeaders(
  headers: Record<string, string>,
  whitelist = headerWhitelist,
) {
  return Object.entries(headers)
    .filter(([key]) => whitelist.includes(key))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
}
