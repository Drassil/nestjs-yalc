import { GqlError } from './gql.error';

describe('GqlError class', () => {
  it('should be an instance of error', () => {
    expect(new GqlError()).toBeInstanceOf(Error);
  });
});
