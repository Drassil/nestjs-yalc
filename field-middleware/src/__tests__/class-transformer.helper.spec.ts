import { describe, it, expect } from '@jest/globals';
import { ParseArray, parseArray } from '../class-transformer.helper.js'; // change this to your actual file name
import { plainToClass } from 'class-transformer';

describe('ParseArray', () => {
  it('should transform a comma separated string to an array', () => {
    class TestClass {
      @ParseArray()
      field: string[];
    }

    const payload = {
      field: 'a,b,c',
    };

    const transformed = plainToClass(TestClass, payload);
    expect(transformed.field).toEqual(['a', 'b', 'c']);
  });

  it('should transform a semi colon separated string to an array', () => {
    class TestClass {
      @ParseArray({ separator: ';' })
      field: string[];
    }

    const payload = {
      field: 'a;b;c',
    };

    const transformed = plainToClass(TestClass, payload);
    expect(transformed.field).toEqual(['a', 'b', 'c']);
  });

  it('should ignore empty string', () => {
    class TestClass {
      @ParseArray()
      field: string[];
    }

    const payload = {
      field: 'a,b,,c',
    };

    const transformed = plainToClass(TestClass, payload);
    expect(transformed.field).toEqual(['a', 'b', 'c']);
  });
});

describe('parseArray', () => {
  it('should split a string into array by a comma', () => {
    const result = parseArray('a,b,c');
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should split a string into array by a semi colon', () => {
    const result = parseArray('a;b;c', ';');
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should ignore empty string', () => {
    const result = parseArray('a,b,,c');
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should return empty array for empty string', () => {
    const result = parseArray('');
    expect(result).toEqual([]);
  });

  it('should return empty array for undefined', () => {
    const result = parseArray(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array for null', () => {
    const result = parseArray(null);
    expect(result).toEqual([]);
  });

  it('should return empty array for number', () => {
    const result = parseArray(123);
    expect(result).toEqual([123]);
  });

  it('should return array for array', () => {
    const result = parseArray(['a', 'b', 'c']);
    expect(result).toEqual(['a', 'b', 'c']);
  });
});
