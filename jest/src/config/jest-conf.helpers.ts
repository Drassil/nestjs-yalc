import { IProjectInfo } from './jest-conf.generator';

export function nestjsCliJsonToProjectList(nestCliJson: any): {
  [key: string]: IProjectInfo;
} {
  const projectList: { [key: string]: IProjectInfo } = {};

  Object.keys(nestCliJson.projects).map((k: any) => {
    const p = nestCliJson.projects[k];
    projectList[k] = {
      path: p.root,
      sourcePath: p.sourceRoot,
      type: p.type,
    };
  });

  return projectList;
}
