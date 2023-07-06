import {
  expect,
  jest,
  describe,
  it,
  beforeEach,
  beforeAll,
  afterAll,
  afterEach,
} from '@jest/globals';
import rxjs from 'rxjs';

const rxjsHelper = await import('../rxjs.helper.js');

describe('test rxjs helper', () => {
  it('should execute switchTap', async () => {
    const subject = rxjs.of(1).pipe(
      rxjsHelper.switchTap(async (value: any, index: number) => {
        return value;
      }),
    );

    await expect(rxjs.lastValueFrom(subject)).resolves.toEqual(1);
  });

  it('should execute switchTap without return any values', async () => {
    const subject = rxjs
      .of(1)
      .pipe(rxjsHelper.switchTap(async (value: any, index: number) => {}));

    await expect(rxjs.lastValueFrom(subject)).resolves.toEqual(1);
  });

  it('should execute switchTap returning a null value', async () => {
    const subject = rxjs
      .of(1)
      .pipe(rxjsHelper.switchTap(async (value: any, index: number) => null));

    await expect(rxjs.lastValueFrom(subject)).resolves.toEqual(null);
  });

  it('should execute wrapIntoObservable', () => {
    const subject = rxjsHelper.wrapIntoObservable(new rxjs.Observable());
    expect(subject).toBeDefined();
  });

  it('should execute wrapIntoObservable with async function', () => {
    const subject = rxjsHelper.wrapIntoObservable(async () => {});
    expect(subject).toBeDefined();
  });

  it('should execute wrapIntoObservable with non-async function', () => {
    const subject = rxjsHelper.wrapIntoObservable(() => {});
    expect(subject).toBeDefined();
  });

  it('should execute wrapIntoObservable with null', () => {
    const subject = rxjsHelper.wrapIntoObservable(null);
    expect(subject).toBeDefined();
  });

  it('should execute wrapIntoAnOperator', () => {
    const subject = rxjsHelper.wrapIntoAnOperator(
      (value: any, index: number) => {
        return value;
      },
    );
    expect(subject(new rxjs.Observable())).toBeDefined();
  });

  it('should execute wrapIntoAnOperator with async function', () => {
    const subject = rxjsHelper.wrapIntoAnOperator(
      async (value: any, index: number) => {
        return value;
      },
    );
    expect(subject(new rxjs.Observable())).toBeDefined();
  });
});
