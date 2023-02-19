import {
  IAppProjSetting,
  IOptions,
  IProjectInfo,
  jestConfGenerator,
} from '@nestjs-yalc/jest-config';

console.log('=================== LOADING JEST OPTIONS ================');

import tsProjects from './tsconfig.json';

const appProjectsSettings: { [key: string]: IAppProjSetting } = {};

const projectList: { [key: string]: IProjectInfo } = {};

const paths: Record<string, string[]> = tsProjects.compilerOptions.paths;
Object.keys(paths).map((k: string) => {
  const path: string = paths[k][0];

  if (!k.endsWith('*')) {
    projectList[k] = {
      path: path.replace('/src', ''),
      sourcePath: path,
      type: 'library',
    };
  }
});

const options: IOptions = {
  defaultConfOptions: {
    transformEsModules: false,
    jestConf: {
      // injectGlobals: false, -> we can't set it to false because of this issue: https://github.com/golevelup/nestjs/issues/557
    },
  },
  // TODO: re-enable everything except types
  skipProjects: ['types', 'graphql', 'crud-gen', 'kafka', 'jest'],
  defaultCoverageThreshold: {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100,
  },
  confOverrides: {
    '@nestjs-yalc/app': {
      coverageThreshold: {
        statements: 8.19,
        branches: 0,
        functions: 10.71,
        lines: 7.69,
      },
    },
    '@nestjs-yalc/aws-helpers': {
      coverageThreshold: {
        branches: 100,
        functions: 95.23,
        lines: 91.66,
        statements: 92.59,
      },
    },
    '@nestjs-yalc/logger': {
      coverageThreshold: {
        branches: 60.13,
        functions: 83.87,
        lines: 88.7,
        statements: 89.31,
      },
    },
    '@nestjs-yalc/utils': {
      coverageThreshold: {
        branches: 88.33,
        functions: 86.95,
        lines: 83.69,
        statements: 84.46,
      },
    },
  },
};

const conf = jestConfGenerator(
  __dirname,
  projectList,
  appProjectsSettings,
  options,
);

conf.injectGlobals = false;

export default conf;
