import 'reflect-metadata';
import { SkeletonModule } from '../index.js';

import * as helpers from '@nestjs-yalc/crud-gen/crud-gen.helpers.js';

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
