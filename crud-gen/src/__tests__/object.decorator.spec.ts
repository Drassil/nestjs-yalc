import {
  CrudGenField,
  CrudGenObject,
  getCrudGenFieldMetadata,
  getCrudGenObjectMetadata,
  hasCrudGenFieldMetadata,
  hasCrudGenFieldMetadataList,
  hasCrudGenObjectMetadata,
  ICrudGenFieldMetadata,
} from '../object.decorator';
import { TestEntityDto } from '../__mocks__/entity.mock';
import { fixedIncludefilterOption } from '../__mocks__/filter.mocks';
import * as ObjectDecorator from '../object.decorator';

import * as NestGraphql from '@nestjs/graphql';
import { FieldOptions, ReturnTypeFunc } from '@nestjs/graphql';
import { BaseEntity } from 'typeorm';

const fixedCrudGenFieldMetadata: ICrudGenFieldMetadata = {
  gqlOptions: {},
  gqlType: () => String,
};

describe('ObjectDecorator', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('Should decorate properly a property with CrudGenField', () => {
    class TestObject {
      @CrudGenField(fixedCrudGenFieldMetadata)
      decoratedProperty = {};

      property = 'notDecorated';
    }

    expect(hasCrudGenFieldMetadataList(TestObject)).toBeTruthy();

    let metadata = getCrudGenFieldMetadata(TestObject, 'decoratedProperty');
    expect([metadata.dst, metadata.src]).toEqual(
      expect.arrayContaining(['decoratedProperty', 'decoratedProperty']),
    );

    metadata = getCrudGenFieldMetadata(TestObject, 'property');
    expect(hasCrudGenFieldMetadata(TestObject, 'property')).toBeFalsy();
    expect(metadata).toBeUndefined();
  });

  it('Should decorate properly an object with CrudGenObject', () => {
    @CrudGenObject()
    class TestObject {
      decoratedProperty = {};
    }

    expect(hasCrudGenObjectMetadata(TestObject)).toBeTruthy();
  });

  it('Should copy the metadata from an object to another', () => {
    @CrudGenObject({ filters: fixedIncludefilterOption })
    class BaseDecoratedClass {
      @CrudGenField({})
      baseDecoratedProperty: 'string';
    }

    @CrudGenObject({
      copyFrom: BaseDecoratedClass,
    })
    class TestObject2 {}

    expect(hasCrudGenObjectMetadata(TestObject2)).toBeTruthy();

    const metadata = getCrudGenObjectMetadata(TestObject2);

    expect(metadata).toEqual({
      copyFrom: BaseDecoratedClass,
      filters: fixedIncludefilterOption,
    });
  });

  it('Should decorate properly a property with a custom gqlOptions', () => {
    const metadata = getCrudGenFieldMetadata(TestEntityDto, 'id');
    expect([metadata.dst, metadata.src]).toEqual(
      expect.arrayContaining(['id']),
    );
    expect(hasCrudGenFieldMetadata(TestEntityDto, 'id')).toBeTruthy();
  });

  it('Should CrudGenField work properly with default values', () => {
    jest
      .spyOn(ObjectDecorator, 'getCrudGenFieldMetadataList')
      .mockReturnValue({});

    const mockedNestGraphql = NestGraphql as jest.Mocked<typeof NestGraphql>;
    mockedNestGraphql.addFieldMetadata = jest.fn();

    let gqlOptions: FieldOptions | undefined = undefined;
    let gqlType: ReturnTypeFunc | undefined = () => BaseEntity;

    let crudGenFieldDecorator = CrudGenField({
      gqlType,
      gqlOptions,
    });

    crudGenFieldDecorator({}, 'propertyKey');

    expect(mockedNestGraphql.addFieldMetadata).toHaveBeenCalledWith(
      gqlType,
      {},
      {},
      'propertyKey',
    );
    gqlOptions = { name: 'name' };
    gqlType = undefined;

    crudGenFieldDecorator = CrudGenField({
      gqlType,
      gqlOptions,
    });

    crudGenFieldDecorator({}, 'propertyKey');
    expect(mockedNestGraphql.addFieldMetadata).toHaveBeenCalledWith(
      gqlOptions,
      gqlOptions,
      {},
      'propertyKey',
    );
  });
});
