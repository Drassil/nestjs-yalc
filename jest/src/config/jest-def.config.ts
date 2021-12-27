/* istanbul ignore file */

import * as path from "path";
import { pathsToModuleNameMapper } from "ts-jest/utils";
import { compilerOptions } from "../../../tsconfig.json";
import { defaults } from "jest-config";

export const coveragePathIgnorePatterns = [
  "/env/dist/",
  "/node_modules/",
  "/database/seeds/",
  "/database/migrations/",
  "/test/feature/",
];

export const globals = (tsConfPath = "") => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const tsConfig = require(path.resolve(tsConfPath));
  return {
    __JEST_DISABLE_DB: true,
    "ts-jest": {
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

export const coverageThreshold = (projects: any[] = []) => {
  const coverage = {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  };

  projects.map((project) => {
    const branches = 100;
    const functions = 100;
    const lines = 100;
    const statements = 100;

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
      branches,
      functions,
      lines,
      statements,
    };
  });

  return coverage;
};

export const globalsE2E = (tsConfPath = "") => ({
  "ts-jest": {
    astTransformers: {
      before: [path.join(__dirname, "gql-plugin.js")],
    },
    diagnostics: false,
    tsconfig: path.resolve(tsConfPath),
  },
});

const defaultConf = (dirname: string) => ({
  rootDir: dirname,
  modulePathIgnorePatterns: [
    "<rootDir>/var/",
    "<rootDir>/env/",
    "<rootDir>/docs/",
    "<rootDir>/node_modules/",
  ],
  preset: "ts-jest",
  coverageProvider: "v8",
  testEnvironment: "node",
  moduleFileExtensions: [...defaults.moduleFileExtensions, "ts"], // add typescript to the default options
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: dirname,
  }),
  errorOnDeprecated: true,
});

export const createE2EConfig = (alias: string, dirname: string) => ({
  ...defaultConf(dirname),
  name: `e2e/${alias}`,
  displayName: `e2e/${alias}`,
  testRegex: "main.ts",
  setupFilesAfterEnv: [`${dirname}/jest.e2e-setup.ts`],
  roots: [`${dirname}`],
  globals: globalsE2E(path.resolve(`${dirname}/../tsconfig.json`)),
  bail: 1,
});

export default defaultConf;
