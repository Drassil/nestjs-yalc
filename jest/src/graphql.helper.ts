import { DeepMocked } from '@golevelup/ts-jest';
import { jest } from '@jest/globals';
import { importMockedEsm } from './esm.helper.js';

export async function createNestJsGraphqlMock(importMeta: { url: string }) {
  const mockedGraphql = (await importMockedEsm(
    '@nestjs/graphql',
    importMeta,
    true,
  )) as DeepMocked<typeof import('@nestjs/graphql')>;

  class Fake {}
  // mock everything as a jest.fn
  Object.keys(mockedGraphql).forEach((key) => {
    mockedGraphql[key].mockImplementation?.(() => jest.fn());
  });
  // except these that should be a class
  mockedGraphql.OmitType.mockImplementation((() => Fake) as any);
  mockedGraphql.PickType.mockImplementation((() => Fake) as any);
  mockedGraphql.PartialType.mockImplementation((() => Fake) as any);
  mockedGraphql.IntersectionType.mockImplementation((() => Fake) as any);

  return mockedGraphql;
}

export async function mockNestJSGraphql(importMeta: { url: string }) {
  const mockedGraphql = await createNestJsGraphqlMock(importMeta);

  jest.unstable_mockModule('@nestjs/graphql', () => mockedGraphql);

  return mockedGraphql;
}
