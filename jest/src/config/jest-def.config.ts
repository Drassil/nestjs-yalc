/* istanbul ignore file */

import * as path from 'path';
import * as readTsConfig from 'get-tsconfig';
import { pathsToModuleNameMapper } from 'ts-jest';
import { defaults } from 'jest-config';
import type { JestConfigWithTsJest } from 'ts-jest';

export const coveragePathIgnorePatterns = [
  '/env/dist/',
  '/node_modules/',
  '/database/seeds/',
  '/database/migrations/',
  '/test/feature/',
];

export const globals = () => {
  return {
    __JEST_DISABLE_DB: true,
  };
};

export const tsJestConfigE2E = (tsConfPath = '', withGqlPlugin = true) => {
  const tsConfig = readTsConfig.getTsconfig(path.resolve(tsConfPath));

  const conf: any = {
    diagnostics: false,
    isolatedModules: true,
    tsconfig: {
      ...(tsConfig?.config.compilerOptions ?? {}),
    },
  };

  if (withGqlPlugin) {
    conf.astTransformers = {
      before: [path.join(__dirname, 'gql-plugin.js')],
    };
  }

  return conf;
};

export const tsJestConfig = (tsConfPath = '') => {
  const tsConfig = readTsConfig.getTsconfig(path.resolve(tsConfPath));

  return {
    tsconfig: {
      ...(tsConfig?.config.compilerOptions ?? {}),
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
    //   case 'unit/common/crud-gen':
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

export interface IDefaultConfOptions {
  /** node modules to transform
   * string array -> add extra esmodule to transform
   * true -> transform esmodule only using the default array
   * false -> disable esmodule transformation (default)
   */
  transformEsModules?: string[] | boolean;
  tsJestConf?: any;
}

/**
 * for both unit and e2e
 * @param dirname
 * @returns
 */
const defaultConf = (
  dirname: string,
  options: IDefaultConfOptions = {},
  tsJestConfig: any = {},
): JestConfigWithTsJest => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const compilerOptions = require(`${dirname}/tsconfig.json`).compilerOptions;

  // We need this to make sure that some esm modules are transformed
  // ref: https://github.com/nrwl/nx/issues/812
  // ref: https://github.com/jaredpalmer/tsdx/issues/187#issuecomment-825536863

  const config: JestConfigWithTsJest = {
    rootDir: dirname,
    modulePathIgnorePatterns: [
      '<rootDir>/var/',
      '<rootDir>/env/',
      '<rootDir>/docs/',
      '<rootDir>/node_modules/',
    ],
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts'], // add typescript to the default options
    testRegex: '.*\\.spec\\.ts$',
    transform: {
      '^.+\\.(t|j)sx?$': [
        'ts-jest',
        {
          useESM: true,
          ...tsJestConfig,
        },
      ],
    },
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1', // for ESM support
      // ...pathsToModuleNameMapper(compilerOptions.paths, {
      //   prefix: dirname,
      // }),
    },
    errorOnDeprecated: true,
    // extensionsToTreatAsEsm: ['.ts'],
    // injectGlobals: true
  };

  if (options.transformEsModules) {
    const esModules = [
      ...(Array.isArray(options.transformEsModules)
        ? options.transformEsModules
        : []),
      'aggregate-error',
      'clean-stack',
      'escape-string-regexp',
      'indent-string',
      'p-map',
    ].join('|');

    config.transformIgnorePatterns = [
      `[/\\\\]node_modules[/\\\\](?!${esModules}).+\\.(js|jsx)$`,
    ];
  }

  return config;
};

export interface E2EOptions {
  alias?: string;
  e2eDirname: string;
  rootDirname: string;
  defaultConfOptions?: IDefaultConfOptions;
  confOverride?: JestConfigWithTsJest;
  withGqlPlugins?: boolean;
}

export const createE2EConfig = (options: E2EOptions): JestConfigWithTsJest => {
  let conf: JestConfigWithTsJest = {
    ...defaultConf(
      `${options.rootDirname}`,
      options.defaultConfOptions,
      tsJestConfigE2E(
        path.resolve(`${options.e2eDirname}/tsconfig.json`),
        options.withGqlPlugins ?? false,
      ),
    ),
    testRegex: '.*\\.e2e-spec\\.ts$',
    setupFilesAfterEnv: [`${options.e2eDirname}/jest.e2e-setup.ts`],
    roots: [`${options.e2eDirname}`],
    bail: 1,
  };

  if (options.alias) {
    conf.displayName = `e2e/${options.alias}`;
    // conf.name = `e2e/${options.alias}`;
  }

  if (options.confOverride) {
    conf = {
      ...conf,
      ...options.confOverride,
    };
  }

  return conf;
};

export default defaultConf;
