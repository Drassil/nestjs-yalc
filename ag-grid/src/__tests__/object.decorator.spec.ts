import {
  AgGridField,
  AgGridObject,
  getAgGridFieldMetadata,
  getAgGridObjectMetadata,
  hasAgGridFieldMetadata,
  hasAgGridFieldMetadataList,
  hasAgGridObjectMetadata,
  IAgGridFieldMetadata,
} from '../object.decorator';
import { fixedIncludefilterOption } from '../__mocks__/filter.mocks';
import * as ObjectDecorator from '../object.decorator';

import * as NestGraphql from '@nestjs/graphql';
import { FieldOptions, ReturnTypeFunc } from '@nestjs/graphql';
import { BaseEntity } from 'typeorm';

const fixedAgGridFieldMetadata: IAgGridFieldMetadata = {
  gqlOptions: {},
  gqlType: () => String,
};

describe('ObjectDecorator', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('Should decorate properly a property with AgGridField', () => {
    class TestObject {
      @AgGridField(fixedAgGridFieldMetadata)
      decoratedProperty = {};

      property = 'notDecorated';
    }

    expect(hasAgGridFieldMetadataList(TestObject)).toBeTruthy();

    let metadata = getAgGridFieldMetadata(TestObject, 'decoratedProperty');
    expect([metadata.dst, metadata.src]).toEqual(
      expect.arrayContaining(['decoratedProperty', 'decoratedProperty']),
    );

    metadata = getAgGridFieldMetadata(TestObject, 'property');
    expect(hasAgGridFieldMetadata(TestObject, 'property')).toBeFalsy();
    expect(metadata).toBeUndefined();
  });

  it('Should decorate properly an object with AgGridObject', () => {
    @AgGridObject()
    class TestObject {
      decoratedProperty = {};
    }

    expect(hasAgGridObjectMetadata(TestObject)).toBeTruthy();
  });

  it('Should copy the metadata from an object to another', () => {
    @AgGridObject({ filters: fixedIncludefilterOption })
    class BaseDecoratedClass {
      @AgGridField({})
      baseDecoratedProperty: 'string';
    }

    @AgGridObject({
      copyFrom: BaseDecoratedClass,
    })
    class TestObject2 {}

    expect(hasAgGridObjectMetadata(TestObject2)).toBeTruthy();

    const metadata = getAgGridObjectMetadata(TestObject2);

    expect(metadata).toEqual({
      copyFrom: BaseDecoratedClass,
      filters: fixedIncludefilterOption,
    });
  });

  it('Should decorate properly a property with a custom gqlOptions', () => {
    jest
      .spyOn(ObjectDecorator, 'getAgGridFieldMetadataList')
      .mockReturnValueOnce({});

    class TestObject {
      @AgGridField({
        ...fixedAgGridFieldMetadata,
        gqlOptions: { name: 'propertyDecorated' },
      })
      decoratedProperty = {};
    }

    const metadata = getAgGridFieldMetadata(TestObject, 'decoratedProperty');
    expect([metadata.dst, metadata.src]).toEqual(
      expect.arrayContaining(['decoratedProperty', 'propertyDecorated']),
    );
    expect(
      hasAgGridFieldMetadata(TestObject, 'decoratedProperty'),
    ).toBeTruthy();
  });

  it('Should AgGridField work properly with default values', () => {
    jest
      .spyOn(ObjectDecorator, 'getAgGridFieldMetadataList')
      .mockReturnValue({});

    const mockedNestGraphql = NestGraphql as jest.Mocked<typeof NestGraphql>;
    mockedNestGraphql.addFieldMetadata = jest.fn();

    let gqlOptions: FieldOptions | undefined = undefined;
    let gqlType: ReturnTypeFunc | undefined = () => BaseEntity;

    let agGridFieldDecorator = AgGridField({
      gqlType,
      gqlOptions,
    });

    agGridFieldDecorator({}, 'propertyKey');

    expect(mockedNestGraphql.addFieldMetadata).toHaveBeenCalledWith(
      gqlType,
      {},
      {},
      'propertyKey',
    );
    gqlOptions = { name: 'name' };
    gqlType = undefined;

    agGridFieldDecorator = AgGridField({
      gqlType,
      gqlOptions,
    });

    agGridFieldDecorator({}, 'propertyKey');
    expect(mockedNestGraphql.addFieldMetadata).toHaveBeenCalledWith(
      gqlOptions,
      gqlOptions,
      {},
      'propertyKey',
    );
  });
});
