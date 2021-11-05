/* istanbul ignore file */

import * as path from 'path';

export function getTestFilenameWithoutExtension(
  testPath: string,
  testExtension?: string,
) {
  // let name = path.basename(testPath).replace('.', '');
  // name = name.split('.')[0];
  return path
    .basename(testPath)
    .replace('.spec.ts', '')
    .replace('.e2e-spec.ts', '')
    .replace(testExtension ?? '', '');
}
