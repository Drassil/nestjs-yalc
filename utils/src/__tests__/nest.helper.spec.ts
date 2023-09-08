import { describe, expect, it } from '@jest/globals';
import { isProviderObject } from '../nestjs/nest.helper.js';

describe('isProviderObject', () => {
  it('should return true for a provider object', () => {
    const provider = {
      provide: 'PROVIDER',
      useValue: 'VALUE',
    };

    expect(isProviderObject(provider)).toBe(true);
  });

  it('should return false for a non-provider object', () => {
    const provider = {
      provide: 'PROVIDER',
      useValue: 'VALUE',
    };

    expect(isProviderObject(provider)).toBe(true);
  });

  it('should return false for a non-object', () => {
    expect(isProviderObject('string')).toBe(false);
  });
});
