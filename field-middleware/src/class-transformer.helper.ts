import { Transform } from 'class-transformer';

export function ParseArray({ separator = ',' } = {}) {
  return Transform(({ value }) => parseArray(value, separator));
}

export function parseArray(value: string, separator = ',') {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return [value];
  }

  return value.split(separator).filter((item: string) => item.length > 0);
}
