/* istanbul ignore file */

/* eslint-disable @typescript-eslint/no-var-requires */
const transformer = require('@nestjs/graphql/plugin');

module.exports.name = 'nestjs-graphql-transformer';
// you should change the version number anytime you change the configuration below - otherwise, jest will not detect changes
module.exports.version = 3;

module.exports.factory = (cs) => {
  return transformer.before(
    {
      typeFileNameSuffix: ['.input.ts', '.args.ts', '.entity.ts', '.type.ts'],
      introspectComments: true,
    },
    cs.tsCompiler.program,
  );
};
