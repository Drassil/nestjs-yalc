/* istanbul ignore file */

import * as path from "path";
import * as readTsConfig from "get-tsconfig";
// import { pathsToModuleNameMapper } from 'ts-jest';
import { defaults } from "jest-config";
import type { JestConfigWithTsJest } from "ts-jest";

export const coveragePathIgnorePatterns = [
  "/env/dist/",
  "/node_modules/",
  "/database/seeds/",
  "/database/migrations/",
  "/test/feature/"
];

export const globals = () => {
  return {
    __JEST_DISABLE_DB: true
  };
};

export const tsJestConfigE2E = (
  tsConfPath = "",
  withGqlPlugin = true,
  overrideTsJestConfig?: any
) => {
  const tsConfigFile = readTsConfig.getTsconfig(path.resolve(tsConfPath));
  const { tsconfig, ...restTsJest } = overrideTsJestConfig ?? {};

  const conf: any = {
    diagnostics: false,
    isolatedModules: true,
    tsconfig: {
      ...(tsConfigFile?.config.compilerOptions ?? {}),
      ...(tsconfig ?? {})
    },
    ...restTsJest
  };

  if (withGqlPlugin) {
    conf.astTransformers = {
      before: [path.join(__dirname, "gql-plugin.js")]
    };
  }

  return conf;
};

export const tsJestConfig = (tsConfPath = "", overrideTsJestConfig?: any) => {
  const tsConfigFile = readTsConfig.getTsconfig(
    path.resolve(path.dirname(tsConfPath)),
    path.basename(tsConfPath)
  );

  if (tsConfigFile?.path !== tsConfPath) {
    throw new Error(`Cannot find ${tsConfPath}`);
  }

  const { tsconfig, ...restTsJest } = overrideTsJestConfig ?? {};

  const config = {
    tsconfig: {
      ...(tsConfigFile?.config.compilerOptions ?? {}),
      emitDecoratorMetadata: false,
      experimentalDecorators: false,
      ...(tsconfig ?? {})
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
    ...restTsJest
  };

  return config;
};

export const coverageThreshold = (
  projects: any[] = [],
  defaultCoverageThreshold = {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100
  }
) => {
  const coverage: Record<string, any> = {
    global: {
      ...defaultCoverageThreshold
    }
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
      ...defaultCoverageThreshold
    };

    if (project?.coverageThreshold) {
      coverage[project.rootDir] = {
        ...coverage[project.rootDir],
        ...project?.coverageThreshold
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
  jestConf?: any;
}

/**
 * for both unit and e2e
 * @param dirname
 * @returns
 */
const defaultConf = (
  dirname: string,
  options: IDefaultConfOptions = {},
  tsJestConfig: any = {}
): JestConfigWithTsJest => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const compilerOptions = require(`${dirname}/tsconfig.json`).compilerOptions;

  // We need this to make sure that some esm modules are transformed
  // ref: https://github.com/nrwl/nx/issues/812
  // ref: https://github.com/jaredpalmer/tsdx/issues/187#issuecomment-825536863

  const config: JestConfigWithTsJest = {
    rootDir: dirname,
    modulePathIgnorePatterns: [
      "<rootDir>/var/",
      "<rootDir>/env/",
      "<rootDir>/docs/",
      "<rootDir>/node_modules/"
    ],
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    moduleFileExtensions: [...defaults.moduleFileExtensions, "ts"], // add typescript to the default options
    testRegex: ".*\\.spec\\.ts$",
    transform: {
      "^.+\\.(t|j)sx?$": [
        "ts-jest",
        {
          useESM: true,
          ...tsJestConfig
        }
      ]
    },
    moduleNameMapper: {
      "^(\\.{1,2}/.*)\\.js$": "$1" // for ESM support
      // ...pathsToModuleNameMapper(compilerOptions.paths, {
      //   prefix: dirname,
      // }),
    },
    errorOnDeprecated: true,
    // extensionsToTreatAsEsm: ['.ts'],
    // injectGlobals: false,
    ...options?.jestConf
  };

  if (options.transformEsModules) {
    const esModules = [
      ...(Array.isArray(options.transformEsModules)
        ? options.transformEsModules
        : []),
      "aggregate-error",
      "clean-stack",
      "escape-string-regexp",
      "indent-string",
      "p-map"
    ].join("|");

    config.transformIgnorePatterns = [
      `[/\\\\]node_modules[/\\\\](?!${esModules}).+\\.(js|jsx)$`
    ];
  }

  return config;
};

export default defaultConf;
