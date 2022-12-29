import {
  IAppProjSetting,
  IOptions,
  IProjectInfo,
  jestConfGenerator,
} from './jest/src/config/jest-conf.generator';

const tsProjects = require('./tsconfig.json');

const appProjectsSettings: { [key: string]: IAppProjSetting } = {};

const projectList: { [key: string]: IProjectInfo } = {};

Object.keys(tsProjects.compilerOptions.paths).map((k: string) => {
  const path: string = tsProjects.compilerOptions.paths[k][0];

  if (!k.endsWith('*')) {
    projectList[k] = {
      path: path.replace('/src', ''),
      sourcePath: path,
      type: 'library',
    };
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
