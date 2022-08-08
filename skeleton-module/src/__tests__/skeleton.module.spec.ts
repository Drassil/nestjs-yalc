import 'reflect-metadata';
import { SkeletonModule } from '../index';

import * as helpers from 'crud-gen/src/crud-gen.helpers';

describe('Test skeleton module', () => {
  it('should register the module', () => {
    const spiedCrudGenDependencyFactory = jest.spyOn(
      helpers,
      'CrudGenDependencyFactory',
    );

    const module = SkeletonModule.register('test');
    expect(module).toBeDefined();
    expect(spiedCrudGenDependencyFactory).toHaveBeenCalledTimes(2); // user and phone
  });
});
