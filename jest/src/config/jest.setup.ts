/* istanbul ignore file */

process.env.NODE_ENV = "test";

// without this, jest won't fail with unhandled promises
// (e.g. missing awaits)
if (!process.env.LISTENING_TO_UNHANDLED_REJECTION) {
  process.on("unhandledRejection", (err) => {
    fail(err);
  });
  // Avoid memory leak by adding too many listeners
  process.env.LISTENING_TO_UNHANDLED_REJECTION = "true";
}

jest.mock("@nestjs/graphql", () => {
  class Fake {}
  return {
    ...jest.requireActual<any>("@nestjs/graphql"),
    InputType: () => jest.fn(),
    OmitType: () => Fake,
    PickType: () => Fake,
    PartialType: () => Fake,
    IntersectionType: () => Fake,
  };
});

// jest.mock('@nestjs/common', () => {
//   return {
//     ...jest.requireActual<any>('@nestjs/common'),
//     Injectable: () => jest.fn(),
//   };
// });
