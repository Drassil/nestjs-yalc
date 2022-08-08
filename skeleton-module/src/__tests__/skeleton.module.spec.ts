import 'reflect-metadata';
import { SkeletonModule } from '../index';

import * as helpers from 'crud-gen/src/ag-grid.helpers';

describe('Test skeleton module', () => {
  it('should register the module', () => {
    const spiedAgGridDependencyFactory = jest.spyOn(
      helpers,
      'AgGridDependencyFactory',
    );

    const module = SkeletonModule.register('test');
    expect(module).toBeDefined();
    expect(spiedAgGridDependencyFactory).toHaveBeenCalledTimes(2); // user and phone
  });
});
