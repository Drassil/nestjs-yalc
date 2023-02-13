import { GetContext, paramDecoratorToCreate } from './nest.decorator.js';
import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';

describe('Role decoratortest', () => {
  const mockedCtx = createMock<ExecutionContext>();

  it('Check GetContext', async () => {
    const testData = GetContext(null, mockedCtx);
    expect(testData).toBeDefined();
  });

  it('Check paramDecoratorToCreate ', async () => {
    const testData = paramDecoratorToCreate(null, mockedCtx);
    expect(testData).toEqual(mockedCtx);
  });
});
