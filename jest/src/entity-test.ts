import { ClassType } from '@nestjs-yalc/interfaces/common.type';
import { getTestFilenameWithoutExtension } from './helpers';

export function classesAreDefinedTest(
  moduleName: string,
  classList: ClassType[],
) {
  describe(`${getTestFilenameWithoutExtension(
    moduleName,
  )} classes test`, () => {
    for (const aClass of classList) {
      it(`should be able to create ${aClass.name} class instance`, () => {
        const testData = new aClass();
        expect(testData).toBeInstanceOf(aClass);
      });
    }
  });
}
