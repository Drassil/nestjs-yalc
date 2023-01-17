/* istanbul ignore file */

import * as path from 'path';
import * as readTsConfig from 'get-tsconfig';
import { pathsToModuleNameMapper } from 'ts-jest';
import { defaults } from 'jest-config';
import { Config } from '@jest/types';

export const coveragePathIgnorePatterns = [
  '/env/dist/',
  '/node_modules/',
  '/database/seeds/',
  '/database/migrations/',
  '/test/feature/',
];

export const globalsE2E = (tsConfPath = '', withGqlPlugin = true) => {
  const tsConfig = readTsConfig.getTsconfig(path.resolve(tsConfPath));

  const conf: any = {
    'ts-jest': {
      diagnostics: false,
      isolatedModules: true,
      tsconfig: {
        ...(tsConfig?.config.compilerOptions ?? {}),
      },
    },
  };

  if (withGqlPlugin) {
    conf['ts-jest'].astTransformers = {
      before: [path.join(__dirname, 'gql-plugin.js')],
    };
  }

  return conf;
};

export const globals = (tsConfPath = '') => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const tsConfig = readTsConfig.getTsconfig(path.resolve(tsConfPath));

  return {
    __JEST_DISABLE_DB: true,
    'ts-jest': {
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
  /** node modules to transform */
  esModules: string[];
}

/**
 * for both unit and e2e
 * @param dirname
 * @returns
 */
const defaultConf = (
  dirname: string,
  options?: IDefaultConfOptions,
): Config.InitialOptions => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const compilerOptions = require(`${dirname}/tsconfig.json`).compilerOptions;

  // We need this to make sure that some esm modules are transformed
  // ref: https://github.com/nrwl/nx/issues/812
  // ref: https://github.com/jaredpalmer/tsdx/issues/187#issuecomment-825536863
  const esModules = [
    ...(options?.esModules ?? []),
    'aggregate-error',
    'clean-stack',
    'escape-string-regexp',
    'indent-string',
    'p-map',
  ].join('|');

  return {
    rootDir: dirname,
    modulePathIgnorePatterns: [
      '<rootDir>/var/',
      '<rootDir>/env/',
      '<rootDir>/docs/',
      '<rootDir>/node_modules/',
    ],
    preset: 'ts-jest/presets/default-esm',
    coverageProvider: 'v8',
    testEnvironment: 'node',
    moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts'], // add typescript to the default options
    testRegex: '.*\\.spec\\.ts$',
    transform: {
      '^.+\\.(t|j)sx?$': [
        'ts-jest',
        {
          useESM: true,
        },
      ],
    },
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: dirname,
    }),
    errorOnDeprecated: true,
    extensionsToTreatAsEsm: ['.ts'],
    transformIgnorePatterns: [
      `[/\\\\]node_modules[/\\\\](?!${esModules}).+\\.(js|jsx)$`,
    ],
  };
};

export interface E2EOptions {
  alias?: string;
  e2eDirname: string;
  rootDirname: string;
  defaultConfOptions?: IDefaultConfOptions;
  confOverride?: Config.InitialOptions;
  withGqlPlugins?: boolean;
}

export const createE2EConfig = (options: E2EOptions): Config.InitialOptions => {
  let conf: Config.InitialOptions = {
    ...defaultConf(`${options.rootDirname}`, options.defaultConfOptions),
    testRegex: '.*\\.e2e-spec\\.ts$',
    setupFilesAfterEnv: [`${options.e2eDirname}/jest.e2e-setup.ts`],
    roots: [`${options.e2eDirname}`],
    globals: globalsE2E(
      path.resolve(`${options.e2eDirname}/tsconfig.json`),
      options.withGqlPlugins ?? false,
    ),
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
