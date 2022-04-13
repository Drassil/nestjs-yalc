import 'reflect-metadata';
import { SkeletonModule } from '../index';

jest.mock('@nestjs-yalc/ag-grid/ag-grid.helpers', () => {
  return {
    AgGridDependencyFactory: jest.fn(() => ({
      repository: {},
      providers: [],
    })),
  };
});

// jest.mock('typeorm');

describe('Test skeleton module', () => {
  it('should register the module', () => {
    const module = SkeletonModule.register('test');
    expect(module).toBeDefined();
  });
});
