import { throwWrap } from './error.helper.js';

describe('Test errors helpers', () => {
  it('should throw an error without wraping it', () => {
    const fixedErrorMessage = `i'm an error`;
    const fixedError = new Error(fixedErrorMessage);

    expect(() => throwWrap(fixedErrorMessage)).toThrow(fixedErrorMessage);
    expect(() => throwWrap(fixedError)).toThrowError(fixedErrorMessage);
  });
});
