import {
  IAppProjSetting,
  IOptions,
  IProjectInfo,
  jestConfGenerator
} from "@nestjs-yalc/jest/config/jest-conf.generator.js";

console.log("=================== LOADING JEST OPTIONS ================");

import tsProjects from "./tsconfig.json";

const appProjectsSettings: { [key: string]: IAppProjSetting } = {};

const projectList: { [key: string]: IProjectInfo } = {};

Object.keys(tsProjects.compilerOptions.paths).map((k: string) => {
  const path: string = tsProjects.compilerOptions.paths[k][0];

  if (!k.endsWith("*")) {
    projectList[k] = {
      path: path.replace("/src", ""),
      sourcePath: path,
      type: "library"
    };
  }
});

const options: IOptions = {
  // TODO: re-enable everything except types
  skipProjects: ["types", "graphql", "crud-gen", "kafka"],
  defaultCoverageThreshold: {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100
  },
  confOverrides: {
    "@nestjs-yalc/app": {
      coverageThreshold: {
        statements: 9.62,
        branches: 0,
        functions: 10.71,
        lines: 8.06
      }
    },
    "@nestjs-yalc/aws-helpers": {
      coverageThreshold: {
        branches: 100,
        functions: 95.23,
        lines: 91.66,
        statements: 92.59
      }
    },
    "@nestjs-yalc/logger": {
      coverageThreshold: {
        branches: 60.13,
        functions: 83.87,
        lines: 88.7,
        statements: 89.31
      }
    },
    "@nestjs-yalc/utils": {
      coverageThreshold: {
        branches: 92,
        functions: 86.95,
        lines: 83.69,
        statements: 84.46
      }
    }
  }
};

export default jestConfGenerator(
  __dirname,
  projectList,
  appProjectsSettings,
  options
);
