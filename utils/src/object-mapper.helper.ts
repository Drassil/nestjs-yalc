export type ObjectMapperDestPropertyType<
  TInputObject extends Record<string, any>,
  TOutputObject extends Record<string, any>,
  TPropertyDest extends keyof TOutputObject,
> = {
  transformer?: (
    inputObject: TInputObject,
    propertyName: keyof TInputObject,
  ) => TOutputObject[TPropertyDest];
  exclude?: boolean;
};

type ObjectType<
  TInputObject extends Record<string, any>,
  TOutputObject extends Record<string, any>,
> = {
  [index in keyof TInputObject]:
    | Partial<{
        [K in keyof TOutputObject]:
          | ObjectMapperDestPropertyType<TInputObject, TOutputObject, K>
          | boolean;
      }>
    | keyof TOutputObject
    | false;
} & Partial<{
  [index in '$transformer']: (
    inputObject: TInputObject,
    outputObject: TOutputObject,
  ) => void;
}>;

export type ObjectMapperType<
  TInputObject extends Record<string, any>,
  TOutputObject extends Record<string, any>,
> = ObjectType<TInputObject, TOutputObject>;

function setMappedProperty<
  TInputObject extends Record<string, any>,
  TOutputObject extends Record<string, any>,
  TPropertyDest extends keyof TOutputObject,
>(
  mapProperty:
    | ObjectMapperDestPropertyType<TInputObject, TOutputObject, TPropertyDest>
    | boolean,
  inputObject: TInputObject,
  outputObject: TOutputObject,
  propertyName: keyof TInputObject,
  outputKey: TPropertyDest,
) {
  let options: ObjectMapperDestPropertyType<
    TInputObject,
    TOutputObject,
    TPropertyDest
  >;

  if (typeof mapProperty === 'boolean') {
    if (mapProperty === false) return; // do not map

    options = {};
  } else {
    options = mapProperty;
  }

  if (options.exclude === true) return; // do not map

  outputObject[outputKey] = options.transformer
    ? (options.transformer(inputObject, propertyName) as any)
    : inputObject[propertyName];
}

/**
 * This function allows to map 2 Objects with different properties by using
 * a bridge object (the mapper). In this way we can avoid using property decorators
 * that limit the mapping to a single destination, by allowing any mapping combinations.
 *
 */
export function objectMapper<
  TInputObject extends Record<string, any>,
  TOutputObject extends Record<string, any>,
>(
  inputObject: TInputObject,
  mapper: ObjectMapperType<TInputObject, TOutputObject>,
  options: {
    copyNonMappedProperties?: boolean;
  } = {},
): TOutputObject {
  const outputObject: TOutputObject = {} as TOutputObject;
  for (const propertyName in inputObject) {
    if (propertyName === '$transformer') {
      const transformer = inputObject[propertyName] as (
        inputObject: TInputObject,
        outputObject: TOutputObject,
      ) => void;
      transformer(inputObject, outputObject);
      continue;
    }

    const mapProperty = mapper[propertyName];

    if (mapProperty === false) continue; // do not map/exclude

    if (mapProperty) {
      Object.keys(mapProperty).forEach((mapPropertyKey) => {
        // if (typeof mapProperty === 'boolean') {
        //   outputObject[mapPropertyKey as keyof TOutputObject] = inputObject[
        //     propertyName
        //   ] as any;
        //   return;
        // }

        if (typeof mapProperty !== 'object') {
          outputObject[mapProperty as keyof TOutputObject] = inputObject[
            propertyName
          ] as any;
          return;
        }

        const mapPropertyItem = mapProperty[mapPropertyKey];
        if (mapPropertyItem) {
          setMappedProperty(
            mapPropertyItem,
            inputObject,
            outputObject,
            propertyName,
            mapPropertyKey,
          );
        } else if (options.copyNonMappedProperties === true) {
          outputObject[mapPropertyKey as keyof TOutputObject] = inputObject[
            propertyName
          ] as any;
        }
      });
    } else if (options.copyNonMappedProperties === true) {
      // TODO: use an option to enable this  behaviour
      // if (!Object.keys(outputObject).includes(propertyName))
      //   throw new Error(
      //     `Cannot map property ${propertyName} into the OutputObject. Property doesn't exist in the destination`,
      //   );

      outputObject[propertyName as keyof TOutputObject] = inputObject[
        propertyName
      ] as any;
    }
  }

  return outputObject;
}
