import { enumTransformer } from '../transformer.helper';

enum TestEnum {
  TEST = 'test',
}

const testString = 'test';

describe('Transformer helper', () => {
  it('should not transform enum value to null if it belongs to a specific enumObj', () => {
    const transformer = enumTransformer(TestEnum);

    expect(transformer.to).toBeDefined();
    expect(transformer.from).toBeDefined();

    expect(transformer.to(testString)).toBe(testString);
    expect(transformer.from(testString)).toBe(testString);
  });

  it('should transform enum value to null if it not belongs to a specific enumObj', () => {
    const transformer = enumTransformer(TestEnum);

    expect(transformer.to).toBeDefined();
    expect(transformer.from).toBeDefined();

    expect(transformer.from('')).toBeNull();
  });
});
