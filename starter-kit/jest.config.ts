import {
  IAppProjSetting,
  IOptions,
  IProjectInfo,
  jestConfGenerator,
} from '@nestjs-yalc/jest-config';

console.log('=================== LOADING JEST OPTIONS ================');

import nestCliJson from './nest-cli.json';

const appProjectsSettings: { [key: string]: IAppProjSetting } = {};

const projectList: { [key: string]: IProjectInfo } = {};

Object.keys(nestCliJson.projects).map((k: any) => {
  const p = nestCliJson.projects[k];
  projectList[k] = {
    path: p.root,
    sourcePath: p.sourceRoot,
    type: p.type,
  };
});

const options: IOptions = {
  defaultConfOptions: {
    transformEsModules: false,
    jestConf: {
      // injectGlobals: false, -> we can't set it to false because of this issue: https://github.com/golevelup/nestjs/issues/557
    },
  },
  defaultCoverageThreshold: {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100,
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
