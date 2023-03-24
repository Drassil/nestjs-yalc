import { describe, expect, it } from '@jest/globals';

import { objectMapper } from '../object-mapper.helper.js';

describe('objectMapper', () => {
  it('should map properties with the specified mapper', () => {
    const input = {
      a: 'A',
      b: 'B',
      c: 'C',
    };

    const mapper = {
      a: 'x',
      b: 'y',
      c: false,
    };

    const output = objectMapper(input, mapper);

    expect(output).toEqual({
      x: 'A',
      y: 'B',
    });
  });

  it('should map properties with the specified mapper using transformer', () => {
    const input = {
      a: 'A',
      b: 'B',
    };

    const mapper = {
      a: {
        x: {
          transformer: (
            inputObject: any,
            propertyName: keyof typeof inputObject,
          ) => inputObject[propertyName].toLowerCase(),
        },
      },
      b: {
        y: {
          transformer: (
            inputObject: any,
            propertyName: keyof typeof inputObject,
          ) => inputObject[propertyName].toLowerCase(),
        },
      },
    };

    const output = objectMapper(input, mapper);

    expect(output).toEqual({
      x: 'a',
      y: 'b',
    });
  });

  it('should not map excluded properties in object type mapProperty', () => {
    const input = {
      a: 'A',
      b: 'B',
    };

    const mapper = {
      a: {
        x: {
          exclude: true,
        },
        y: true,
      },
    };

    const output = objectMapper(input, mapper);

    expect(output).toEqual({
      y: 'A',
    });
  });

  it('should exclude properties with false value in object type mapProperty', () => {
    const input = {
      a: 'A',
      b: 'B',
    };

    const mapper = {
      a: {
        x: false,
        y: true,
      },
    };

    const output = objectMapper(input, mapper);

    expect(output).toEqual({
      y: 'A',
    });
  });

  it('should copy non-mapped properties when copyNonMappedProperties option is true', () => {
    const input = {
      a: 'A',
      b: 'B',
    };

    const mapper = {
      a: 'x',
      z: {
        y: null,
      },
    };

    const output = objectMapper(input, mapper, {
      copyNonMappedProperties: true,
    });

    expect(output).toEqual({
      x: 'A',
      b: 'B',
    });
  });

  it('should not copy non-mapped properties when copyNonMappedProperties option is false', () => {
    const input = {
      a: 'A',
      b: 'B',
    };

    const mapper = {
      a: 'x',
    };

    const output = objectMapper(input, mapper, {
      copyNonMappedProperties: false,
    });

    expect(output).toEqual({
      x: 'A',
    });
  });

  it('should call the $transformer function if defined in the input object', () => {
    const input = {
      a: 'A',
      b: 'B',
      $transformer: (
        inputObject: { a: string; b: string },
        outputObject: { x: string; y: string },
      ) => {
        outputObject.y = inputObject.b.toLowerCase();
      },
    };

    const mapper = {
      a: 'x',
    };

    const output = objectMapper(input, mapper);

    expect(output).toEqual({
      x: 'A',
      y: 'b',
    });
  });
});
