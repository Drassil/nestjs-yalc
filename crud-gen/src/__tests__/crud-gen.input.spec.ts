import {
  agJoinArgFactory,
  filterExpressionInputFactory,
  RowGroup,
  SortModel,
  sortModelFactory,
} from '../crud-gen.input';
import * as AgGridEnum from '../crud-gen.enum';
import * as AgGridHelpers from '../crud-gen.helpers';
import { TestEntity, TestEntityRelation } from '../__mocks__/entity.mock';

describe('Dynamic user input dto test', () => {
  const spiedEntityFieldsEnumFactory = jest.spyOn(
    AgGridEnum,
    'entityFieldsEnumFactory',
  );

  it('Check RowGroup Dto', async () => {
    const testData = new RowGroup();

    expect(testData).toBeDefined();
  });
  it('Check SortModel Dto', async () => {
    const testData = new SortModel();

    expect(testData).toBeDefined();
  });

  describe('Check SortModelFactory', () => {
    beforeEach(() => {
      spiedEntityFieldsEnumFactory.mockReturnValue({
        ['test']: 'test',
      });
    });

    afterEach(() => {
      spiedEntityFieldsEnumFactory.mockReset();
    });

    it('Should return a SortModel correctly not cached', () => {
      const result = sortModelFactory<TestEntity>(TestEntity);
      expect(result).toBeDefined();
      expect(spiedEntityFieldsEnumFactory).toHaveBeenCalledTimes(1);
      spiedEntityFieldsEnumFactory.mockReset();
    });

    it('Should return a SortModel correctly cached', () => {
      const result = sortModelFactory<TestEntity>(TestEntity);
      expect(result).toBeDefined();
      expect(spiedEntityFieldsEnumFactory).toHaveBeenCalledTimes(0);
    });
  });

  describe('Check FilterExpressionInputFactory', () => {
    beforeEach(() => {
      spiedEntityFieldsEnumFactory.mockReturnValue({
        ['test']: 'test',
      });
    });

    afterEach(() => {
      spiedEntityFieldsEnumFactory.mockReset();
    });

    it('Should return a FilterExpression correctly not cached', () => {
      const result = filterExpressionInputFactory<TestEntity>(TestEntity);
      expect(result).toBeDefined();
      expect(spiedEntityFieldsEnumFactory).toHaveBeenCalledTimes(1);
      spiedEntityFieldsEnumFactory.mockReset();
    });

    it('Should return a FilterExpression correctly cached', () => {
      const result = filterExpressionInputFactory<TestEntity>(TestEntity);
      expect(result).toBeDefined();
      expect(spiedEntityFieldsEnumFactory).toHaveBeenCalledTimes(0);
    });
  });

  it('Should return the JoinOptionInput already cached', () => {
    const spiedgetEntityRelations = jest.spyOn(
      AgGridHelpers,
      'getEntityRelations',
    );
    const result = agJoinArgFactory(TestEntityRelation);
    expect(result).toBeDefined();

    const cachedResult = agJoinArgFactory(TestEntityRelation);
    expect(cachedResult).toBe(result);
    expect(spiedgetEntityRelations).toHaveBeenCalledTimes(1);
  });
});
