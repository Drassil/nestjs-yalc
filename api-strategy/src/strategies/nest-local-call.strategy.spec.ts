import { createMock } from '@golevelup/ts-jest';
import { HttpAdapterHost } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import {
  NestLocalCallStrategy,
  NestLocalCallStrategyProvider,
} from './nest-local-call.strategy';

describe('NestLocalCallStrategy', () => {
  let adapterHost: HttpAdapterHost;

  beforeEach(() => {
    adapterHost = createMock<HttpAdapterHost>({
      httpAdapter: {
        getInstance: () => createMock<FastifyAdapter>(),
      },
    });
  });

  it('should be defined', () => {
    expect(NestLocalCallStrategy).toBeDefined();
  });

  it('should be instantiable', () => {
    const instance = new NestLocalCallStrategy(adapterHost);
    expect(instance).toBeDefined();
  });

  it('should be able to execute the call method', async () => {
    const instance = new NestLocalCallStrategy(adapterHost);
    const result = await instance.call('http://localhost:3000', {
      method: 'GET',
    });
    expect(result).toBeDefined();
  });

  it('should be able to execute the get method', async () => {
    const instance = new NestLocalCallStrategy(adapterHost);
    const result = await instance.get('http://localhost:3000');
    expect(result).toBeDefined();
  });

  it('should be able to execute the post method', async () => {
    const instance = new NestLocalCallStrategy(adapterHost);
    const result = await instance.post('http://localhost:3000', {});
    expect(result).toBeDefined();
  });

  it('should create a provider', () => {
    const provider = NestLocalCallStrategyProvider('test');
    expect(provider).toBeDefined();
  });

  it('should create a provider and execute the useFactory method', () => {
    const provider = NestLocalCallStrategyProvider('test');
    expect(provider.useFactory(adapterHost)).toBeDefined();
  });
});