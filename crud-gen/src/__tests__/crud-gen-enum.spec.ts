import { BaseEntity } from 'typeorm';
import { entityFieldsEnumFactory } from '../crud-gen.enum';
import * as CrudGenHelper from '../crud-gen.helpers';

const fixedProperty = 'columId';

class TestEntity extends BaseEntity {
  [fixedProperty]: number;
}

describe('entityFieldsEnumFactory', () => {
  let mockedGetMappedTypeProperties;
  let fieldsEnum;

  beforeEach(() => {
    mockedGetMappedTypeProperties = jest.spyOn(
      CrudGenHelper,
      'getMappedTypeProperties',
    );

    mockedGetMappedTypeProperties.mockReturnValue([fixedProperty]);
    fieldsEnum = entityFieldsEnumFactory(TestEntity);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return a defined enum fields not cached', () => {
    expect(fieldsEnum).toBeDefined();
    expect(mockedGetMappedTypeProperties).toHaveBeenCalledTimes(1);
    expect(fieldsEnum[fixedProperty]).toBeDefined();
  });

  it('should return a define enum from cache', () => {
    const cachedFildsEnum = entityFieldsEnumFactory(TestEntity);
    expect(mockedGetMappedTypeProperties).toHaveBeenCalledTimes(0);
    expect(cachedFildsEnum).toStrictEqual(fieldsEnum);
  });

  it('should work with entityModel as a function', () => {
    function objectFunction() {
      this.value = 'value';
    }
    const result = entityFieldsEnumFactory(objectFunction);
    expect(result).toBeDefined();
  });
});
