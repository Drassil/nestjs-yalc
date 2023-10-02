export function isScientificNotation(num: any) {
  const scientificPattern = /^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/;
  return scientificPattern.test(num.toString());
}
