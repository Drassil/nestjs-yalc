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

export function ParseBoolean() {
  return Transform(({ value }) => parseBoolean(value));
}

export function parseBoolean(value: string | boolean) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return false;
  }

  return value === 'true';
}

export function ParseNumber() {
  return Transform(({ value }) => parseNumber(value));
}

export function parseNumber(value: string | number) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string' || value === '') {
    return NaN;
  }

  return Number(value);
}

export function ParseInt() {
  return Transform(({ value }) => parseInt(value));
}

export function parseInt(value: string | number) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string' || Number(value) % 1 !== 0) {
    return NaN;
  }

  return Number.parseInt(value);
}
