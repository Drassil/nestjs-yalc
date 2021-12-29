/* istanbul ignore file */

import * as path from 'path';
import defaultConf, {
  coveragePathIgnorePatterns,
  globals,
  coverageThreshold,
} from './jest-def.config';
import { options as jestOptionObject } from 'jest-cli/build/cli/args';
import yargs from 'yargs';

interface IAppDep {
  name: string;
  path: string;
}
export interface IAppProjSetting {
  confOverride?: any;
  deps: IAppDep[];
}

export interface IOptions {
  skipProjects: string[];
}

// considering our heap consumption (~300-700mb), 5 workers will consume around 3GB of ram
// if you want to increase/decrease this value, you can set the npm_config_jestworkers
// with the `npm config set` command (more info: https://docs.npmjs.com/cli/v7/commands/npm-config)
const maxWorkers = process.env.npm_config_jestworkers || 10;

// eslint-disable-next-line no-console
console.log(`Max workers: ${maxWorkers}`);

export function jestConfGenerator(
  rootPath: string,
  projectList: { [key: string]: string },
  appProjectsSettings: {
    [key: string]: IAppProjSetting;
  },
  options: IOptions,
) {
  const createProjectSets = (projects: any[]) => {
    const _projectSets: { [key: string]: any } = {};
    for (const app in appProjectsSettings) {
      _projectSets[app] = projects.filter((p) =>
        appProjectsSettings[app].deps.some((v) =>
          p.name.startsWith(`unit/${v.name}`),
        ),
      );
    }

    return {
      ..._projectSets,
      all: projects,
    };
  };

  const cacheDirBase = '/tmp/jest_rs/';

  let projects = [];

  const confFactory = (projName: string, root: string, projects?: any) => ({
    ...defaultConf(`${rootPath}/`),
    globals: globals(`${rootPath}/${root}/tsconfig.dev.json`),
    name: `unit/${projName}`,
    displayName: `unit/${projName}`,
    cacheDirectory: `${cacheDirBase}/unit/${projName}`,
    rootDir: `${rootPath}/${root}/`,
    roots: [`${rootPath}/${root}`],
    maxWorkers,
    setupFiles: [`${__dirname}/jest.setup.ts`],
    coverageReporters: ['json-summary', 'json', 'lcov', 'text', 'clover'],
    coverageThreshold: coverageThreshold(projects),
    coveragePathIgnorePatterns,
  });

  for (const projName of Object.keys(projectList)) {
    const proj = projectList[projName];
    if (!options.skipProjects.includes(proj))
      projects.push(confFactory(projName, proj));
  }

  const projectSets: { [key: string]: any } = createProjectSets(projects);

  const selectedProj = process.env.npm_config_bcaproj || 'all';

  projects = projectSets[selectedProj];

  // use argv to catch the path argument in any position
  const argv = yargs(process.argv.slice(2))
    .command('$0 [path]', 'test path', (yargs) => {
      return yargs.positional('path', {
        describe: 'test path',
      });
    })
    .showHelpOnFail(false)
    .options(jestOptionObject)
    .fail(() => {
      // nothing to do
    }).argv;

  const possiblePath = argv.path ?? argv.testPathPattern?.[0];
  const testPath: string = typeof possiblePath === 'string' ? possiblePath : '';

  let config: any = {};

  // "." must be converted to "/"
  let subProjectPath = testPath.startsWith('.') ? testPath.slice(1) : testPath;
  subProjectPath = subProjectPath.startsWith(rootPath)
    ? subProjectPath.slice(rootPath.length)
    : subProjectPath;
  // we always need "/" at the beginning of the string
  subProjectPath = subProjectPath.startsWith('/')
    ? subProjectPath
    : `/${subProjectPath}`;

  // get the project which prefix is closest to testPath
  // to apply the correct path for coverage etc.
  for (const proj of Object.values(projectList)) {
    const root: string = proj;
    if (testPath.startsWith(root) && subProjectPath.length < root.length) {
      subProjectPath = `/${root}`;
    }
  }

  const lastIndexOfSrc = subProjectPath.lastIndexOf(`/src/`);
  if (lastIndexOfSrc >= 0)
    subProjectPath = subProjectPath.substring(0, lastIndexOfSrc);

  // eslint-disable-next-line no-console
  console.debug('Subproject path:', subProjectPath ?? '');

  config = {
    rootDir: `${rootPath}`,
    coverageThreshold: coverageThreshold(
      projects.filter((v: any) =>
        v.rootDir.startsWith(`${rootPath}${subProjectPath}`),
      ),
    ),
    coverageDirectory: path.join(
      rootPath,
      `docs/compodoc/jestcoverage/${subProjectPath}`,
    ),
    collectCoverageFrom: [
      `**/*.{js,ts}`,
      '!**/node_modules/**',
      '!**/.warmup/**',
    ],
  };

  config.projects = projects;

  return config;
}
