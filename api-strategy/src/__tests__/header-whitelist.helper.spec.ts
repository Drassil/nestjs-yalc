import { describe, it, expect } from '@jest/globals';

import { filterHeaders } from '../header-whitelist.helper.js';

describe('whitelistHeaders', () => {
  it('should be defined', () => {
    expect(filterHeaders).toBeDefined();
  });

  it('should filter headers', () => {
    const headers = {
      'x-header': 'x-header',
      'x-header-2': 'x-header-2',
      'x-header-3': 'x-header-3',
    };
    const whitelist = ['x-header', 'x-header-2'];
    const filteredHeaders = filterHeaders(headers, whitelist);
    expect(filteredHeaders).toEqual({
      'x-header': 'x-header',
      'x-header-2': 'x-header-2',
    });
  });

  it('should return undefined if headers are undefined', () => {
    const headers = undefined;
    const whitelist = ['x-header', 'x-header-2'];
    const filteredHeaders = filterHeaders(headers, whitelist);
    expect(filteredHeaders).toBeUndefined();
  });
});
