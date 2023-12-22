import { describe, it, expect } from '@jest/globals';
import {
  ParseArray,
  parseArray,
  ParseBoolean,
  ParseInt,
  ParseNumber,
  parseBoolean,
  parseInt,
  parseNumber,
} from '../class-transformer.helper.js'; // change this to your actual file name
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

describe('ParseBoolean', () => {
  it('should transform a string to boolean', () => {
    class TestClass {
      @ParseBoolean()
      field: boolean;
    }

    const payload = {
      field: 'true',
    };

    const transformed = plainToClass(TestClass, payload);
    expect(transformed.field).toEqual(true);
  });

  it('should transform a boolean to boolean', () => {
    class TestClass {
      @ParseBoolean()
      field: boolean;
    }

    const payload = {
      field: true,
    };

    const transformed = plainToClass(TestClass, payload);
    expect(transformed.field).toEqual(true);
  });

  it('should transform a string to boolean', () => {
    class TestClass {
      @ParseBoolean()
      field: boolean;
    }

    const payload = {
      field: 'false',
    };

    const transformed = plainToClass(TestClass, payload);
    expect(transformed.field).toEqual(false);
  });

  it('should transform a boolean to boolean', () => {
    class TestClass {
      @ParseBoolean()
      field: boolean;
    }

    const payload = {
      field: false,
    };

    const transformed = plainToClass(TestClass, payload);
    expect(transformed.field).toEqual(false);
  });
});

describe('parseBoolean', () => {
  it('should transform a string to boolean', () => {
    const result = parseBoolean('true');
    expect(result).toEqual(true);
  });

  it('should transform a boolean to boolean', () => {
    const result = parseBoolean(true);
    expect(result).toEqual(true);
  });

  it('should transform a string to boolean', () => {
    const result = parseBoolean('false');
    expect(result).toEqual(false);
  });

  it('should transform a boolean to boolean', () => {
    const result = parseBoolean(false);
    expect(result).toEqual(false);
  });

  it('should return false for undefined', () => {
    const result = parseBoolean(undefined);
    expect(result).toEqual(false);
  });

  it('should return false for null', () => {
    const result = parseBoolean(null);
    expect(result).toEqual(false);
  });

  it('should return false for number', () => {
    const result = parseBoolean(123);
    expect(result).toEqual(false);
  });

  it('should return false for empty string', () => {
    const result = parseBoolean('');
    expect(result).toEqual(false);
  });
});

describe('ParseNumber', () => {
  it('should transform a string to number', () => {
    class TestClass {
      @ParseNumber()
      field: number;
    }

    const payload = {
      field: '123',
    };

    const transformed = plainToClass(TestClass, payload);
    expect(transformed.field).toEqual(123);
  });

  it('should transform a number to number', () => {
    class TestClass {
      @ParseNumber()
      field: number;
    }

    const payload = {
      field: 123,
    };

    const transformed = plainToClass(TestClass, payload);
    expect(transformed.field).toEqual(123);
  });
});

describe('parseNumber', () => {
  it('should transform a string to number', () => {
    const result = parseNumber('123');
    expect(result).toEqual(123);
  });

  it('should transform a number to number', () => {
    const result = parseNumber(123);
    expect(result).toEqual(123);
  });

  it('should transform a float to float', () => {
    const result = parseNumber(123.123);
    expect(result).toEqual(123.123);
  });

  it('should transform a string to float', () => {
    const result = parseNumber('123.123');
    expect(result).toEqual(123.123);
  });

  it('should return NaN for undefined', () => {
    const result = parseNumber(undefined);
    expect(result).toEqual(NaN);
  });

  it('should return NaN for null', () => {
    const result = parseNumber(null);
    expect(result).toEqual(NaN);
  });

  it('should return NaN for boolean', () => {
    const result = parseNumber(true);
    expect(result).toEqual(NaN);
  });

  it('should return NaN for empty string', () => {
    const result = parseNumber('');
    expect(result).toEqual(NaN);
  });
});

describe('ParseInt', () => {
  it('should transform a string to number', () => {
    class TestClass {
      @ParseInt()
      field: number;
    }

    const payload = {
      field: '123',
    };

    const transformed = plainToClass(TestClass, payload);
    expect(transformed.field).toEqual(123);
  });

  it('should transform a number to number', () => {
    class TestClass {
      @ParseInt()
      field: number;
    }

    const payload = {
      field: 123,
    };

    const transformed = plainToClass(TestClass, payload);
    expect(transformed.field).toEqual(123);
  });
});

describe('parseInt', () => {
  it('should transform a string to number', () => {
    const result = parseInt('123');
    expect(result).toEqual(123);
  });

  it('should transform a number to number', () => {
    const result = parseInt(123);
    expect(result).toEqual(123);
  });

  it('should return NaN for undefined', () => {
    const result = parseInt(undefined);
    expect(result).toEqual(NaN);
  });

  it('should return NaN for null', () => {
    const result = parseInt(null);
    expect(result).toEqual(NaN);
  });

  it('should return NaN for boolean', () => {
    const result = parseInt(true);
    expect(result).toEqual(NaN);
  });

  it('should return NaN for empty string', () => {
    const result = parseInt('');
    expect(result).toEqual(NaN);
  });

  it('should return NaN for float', () => {
    const result = parseInt('123.123');
    expect(result).toEqual(NaN);
  });
});
