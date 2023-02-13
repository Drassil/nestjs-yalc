import { JsonTransformer } from '../transformers.helpers.js';

describe('Test transformers', () => {
  it('should provide and execute a json transformer', () => {
    const dstObj = { jsonData: {} };
    JsonTransformer('jsonData', 'property')(dstObj, '1');
    expect(dstObj).toStrictEqual({ jsonData: { property: '1' } });
  });

  it('should provide and execute a json transformer with missing subproperty', () => {
    const dstObj = {};
    JsonTransformer('jsonData', 'sub.property')(dstObj, '1');
    expect(dstObj).toStrictEqual({
      jsonData: { sub: { property: '1' } },
    });
  });
});
