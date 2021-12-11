import { arrayGroupByField } from './data-structure.helper';

const testArray = [
  {
    key: 'xx',
    data: 'firstData',
  },
  {
    key: 'xx',
    data: 'seconData',
  },
];
describe('Test Data Structure Helpers', () => {
  it('should groupby an array with a field', () => {
    const groupedArray = arrayGroupByField(testArray, (item) => item.key);
    expect(groupedArray['xx']).toEqual(
      expect.arrayContaining([testArray[0], testArray[1]]),
    );
  });
});
