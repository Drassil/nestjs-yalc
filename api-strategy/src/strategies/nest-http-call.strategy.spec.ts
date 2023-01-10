import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { AxiosInstance } from 'axios';
import {
  NestHttpCallStrategy,
  NestHttpCallStrategyProvider,
} from './nest-http-call.strategy';

describe('NestHttpCallStrategy', () => {
  let httpService: HttpService;

  beforeEach(() => {
    const axiosRef = createMock<AxiosInstance>();
    httpService = createMock<HttpService>({
      axiosRef,
    });
  });

  it('should be defined', () => {
    expect(NestHttpCallStrategy).toBeDefined();
  });

  it('should be instantiable', () => {
    const instance = new NestHttpCallStrategy(httpService);
    expect(instance).toBeDefined();
  });

  it('should be able to execute the call method', async () => {
    const instance = new NestHttpCallStrategy(httpService);
    const result = await instance.call('http://localhost:3000', {
      method: 'GET',
    });
    expect(result).toBeDefined();
  });

  it('should be able to execute the get method', async () => {
    const instance = new NestHttpCallStrategy(httpService);
    const result = await instance.get('http://localhost:3000');
    expect(result).toBeDefined();
  });

  it('should be able to execute the post method', async () => {
    const instance = new NestHttpCallStrategy(httpService);
    const result = await instance.post('http://localhost:3000', {});
    expect(result).toBeDefined();
  });

  it('should create a provider', () => {
    const provider = NestHttpCallStrategyProvider('test');
    expect(provider).toBeDefined();
  });

  it('should create a provider and execute the useFactory method', () => {
    const provider = NestHttpCallStrategyProvider('test');
    expect(provider.useFactory(httpService)).toBeDefined();
  });
});
