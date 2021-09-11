import returnValue, { returnProperty } from './returnValue';

test('returnValue should return a constant function', () => {
  class TypeTest {}

  const testArgSamples = [
    'pass',
    [],
    TypeTest,
    undefined,
    null,
    () => 'Another Function',
  ];

  testArgSamples.forEach((value) => {
    const returnTypeTest = returnValue(value);
    expect(returnTypeTest).toBeInstanceOf(Function);
    expect(returnTypeTest()).toEqual(value);
  });
});

test('returnProperty should return a property of a class', () => {
  class TypeTest {
    validProperty = 'something';
  }

  const returnTypeTest = returnProperty<TypeTest>('validProperty');
  expect(returnTypeTest(new TypeTest())).toBe('something');

  const returnTypeBadTest = returnProperty<any>('invalidProperty');
  expect(returnTypeBadTest(new TypeTest())).toBeUndefined();
});
