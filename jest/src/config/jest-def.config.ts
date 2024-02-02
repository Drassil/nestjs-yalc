/* istanbul ignore file */

import * as path from 'path';
import { pathsToModuleNameMapper } from 'ts-jest';
import { defaults } from 'jest-config';

export const coveragePathIgnorePatterns = [
  '/env/dist/',
  '/node_modules/',
  '/database/seeds/',
  '/database/migrations/',
  '/test/feature/',
];

export const globals = (tsConfPath = '') => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const tsConfig = require(path.resolve(tsConfPath));
  return {
    __JEST_DISABLE_DB: true,
    'ts-jest': {
      tsconfig: {
        ...tsConfig.compilerOptions,
        emitDecoratorMetadata: false,
        experimentalDecorators: false,
      },
      diagnostics: false,
      // Setting isolatedModules to true improves the performance but it
      // also causes several problems with graphql typescript decorators
      // where sometime the coverage is not collected properly.
      // Hence, because of it, decorators must be disabled and mocked
      // related issues:
      // - https://github.com/istanbuljs/istanbuljs/issues/70
      // - https://github.com/kulshekhar/ts-jest/issues/1166
      // - https://stackoverflow.com/questions/57516328/unexpected-uncovered-branch-in-jest-coverage
      isolatedModules: true,
    },
  };
};

export const coverageThreshold = (
  projects: any[] = [],
  defaultCoverageThreshold = {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100,
  },
) => {
  const coverage: Record<string, any> = {
    global: {
      ...defaultCoverageThreshold,
    },
  };

  projects.map((project) => {
    // /**
    //  * @todo  should be removed and be set to 100% asap
    //  */
    // switch (project.name) {
    //   case 'unit/common/ag-grid':
    //     branches = 92.27;
    //     functions = 98.92;
    //     lines = 98.75;
    //     statements = 98.5;
    //     break;
    //   default:
    //     branches = 100;
    //     break;
    // }

    coverage[project.rootDir] = {
      ...defaultCoverageThreshold,
    };

    if (project?.coverageThreshold) {
      coverage[project.rootDir] = {
        ...coverage[project.rootDir],
        ...project?.coverageThreshold,
      };
    }
  });

  return coverage;
};

export const globalsE2E = (tsConfPath = '') => ({
  'ts-jest': {
    astTransformers: {
      before: [path.join(__dirname, 'gql-plugin.js')],
    },
    diagnostics: false,
    tsconfig: path.resolve(tsConfPath),
  },
});

const defaultConf = (dirname: string) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const compilerOptions = require(`${dirname}/tsconfig.json`).compilerOptions;

  return {
    rootDir: dirname,
    modulePathIgnorePatterns: [
      '<rootDir>/var/',
      '<rootDir>/env/',
      '<rootDir>/docs/',
      '<rootDir>/node_modules/',
    ],
    preset: 'ts-jest',
    coverageProvider: 'v8',
    testEnvironment: 'node',
    moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts'], // add typescript to the default options
    testRegex: '.*\\.spec\\.ts$',
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    moduleNameMapper: {
      ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: dirname, }),  
      '^axios$': require.resolve('axios'),
    },
    errorOnDeprecated: true,
  };
};

export const createE2EConfig = (
  alias: string,
  e2eDirname: string,
  rootDirname: string,
) => ({
  ...defaultConf(`${rootDirname}`),
  name: `e2e/${alias}`,
  displayName: `e2e/${alias}`,
  testRegex: 'main.ts',
  setupFilesAfterEnv: [`${e2eDirname}/jest.e2e-setup.ts`],
  roots: [`${e2eDirname}`],
  globals: globalsE2E(path.resolve(`${e2eDirname}/../tsconfig.json`)),
  bail: 1,
});

export default defaultConf;
