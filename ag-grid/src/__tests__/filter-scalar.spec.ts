import { ObjectValueNode, StringValueNode } from 'graphql';
import { FilterType, GeneralFilters } from '../ag-grid.enum';
import { FilterInput } from '../ag-grid.interface';
import { FilterScalar } from '../filter.scalar';

const createdFilterScalar = new FilterScalar();
const fixedString =
  '{"ID":{"filterType":"text","type":"contains","filter":"_"}}';
const fixedObj: FilterInput = {
  ID: {
    filterType: FilterType.TEXT,
    type: GeneralFilters.CONTAINS,
    filter: '_',
  },
};
const objectValueNode: ObjectValueNode = {
  kind: 'ObjectValue',
  fields: [],
};
const stringValueNode: StringValueNode = {
  kind: 'StringValue',
  value: '{"ID":{"filterType":"text","type":"contains","filter":"_"}}',
};
describe('Filter scalar', () => {
  it('Check parsevalue functionality', async () => {
    const testData = createdFilterScalar.parseValue(fixedString);
    expect(testData).toEqual(fixedObj);
  });
  it('Check serialize functionality', async () => {
    const testData = createdFilterScalar.serialize(fixedObj);
    expect(testData).toEqual(fixedString);
  });
  it('Check parseLiteral functionality', async () => {
    const testData = createdFilterScalar.parseLiteral(stringValueNode);
    expect(testData).toEqual(fixedObj);
  });
  it('Check parseLiteral error', async () => {
    expect(() =>
      createdFilterScalar.parseLiteral(objectValueNode),
    ).toThrowError();
  });
});
