import {
  IAppProjSetting,
  IOptions,
  jestConfGenerator,
} from './jest/src/config/jest-conf.generator';

const tsProjects = require('./tsconfig.json');

const appProjectsSettings: { [key: string]: IAppProjSetting } = {};

let projectList: { [key: string]: string } = {};

Object.keys(tsProjects.compilerOptions.paths).map((k: string) => {
  const path: string = tsProjects.compilerOptions.paths[k][0];

  if (!k.endsWith('*')) {
    projectList[k] = path.replace('/src', '');
  }
});

const options: IOptions = {
  skipProjects: ['types', 'graphql'],
};

export default jestConfGenerator(
  __dirname,
  projectList,
  appProjectsSettings,
  options,
);
