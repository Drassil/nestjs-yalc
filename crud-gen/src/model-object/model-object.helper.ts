import { isClass, objectsHaveSameKeys } from '@nestjs-yalc/utils/index.js';
import {
  DstExtended,
  getModelFieldMetadataList,
  isDstExtended,
} from '../object.decorator.js';

function isLikeOutputObject<TOutputObject>(
  input: any,
  output: any,
): input is TOutputObject {
  return objectsHaveSameKeys(input, output) === true;
}

export function modelFieldToDest<
  TInputObject extends Record<string, any>,
  TOutputObject extends Record<string, any>,
>(
  inputObject: TInputObject,
  outputObject: TOutputObject,
): TOutputObject | null {
  if (!isClass(inputObject)) {
    if (!isLikeOutputObject(inputObject, outputObject)) return inputObject;

    return null; // can't map objects
  }

  const mappedObject: TOutputObject = {} as TOutputObject;

  const fieldMetadataList = getModelFieldMetadataList(inputObject);

  const outputKeys = Object.keys(outputObject);

  for (const propertyName of Object.keys(inputObject)) {
    const fieldMetadata = fieldMetadataList?.[propertyName];

    if (!fieldMetadata?.dst) {
      if (outputKeys.includes(propertyName)) {
        mappedObject[propertyName as keyof TOutputObject] = inputObject[
          propertyName as keyof TInputObject
        ] as any;
      }
      continue;
    }

    if (!isDstExtended(fieldMetadata.dst)) {
      if (!outputKeys.includes(fieldMetadata.dst))
        throw new Error(
          `Cannot map property ${fieldMetadata.dst} into the OutputObject. Property doesn't exist in the destination`,
        );

      mappedObject[fieldMetadata.dst as keyof TOutputObject] = inputObject[
        propertyName as keyof TInputObject
      ] as any;
      continue;
    }

    const dst: DstExtended = fieldMetadata.dst;

    if (!outputKeys.includes(dst.name))
      throw new Error(
        `Cannot map extended property ${dst.name} into the OutputObject. Property doesn't exist in the destination`,
      );

    mappedObject[dst.name as keyof TOutputObject] = dst.transformerDst?.(
      mappedObject,
      inputObject[propertyName as keyof TInputObject],
    );
  }

  return mappedObject;
}
