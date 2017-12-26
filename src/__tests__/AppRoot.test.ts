import { Container } from 'inversify';
import AppRoot from '../AppRoot';
import { options } from '../logger';
options.enabled = false;

describe('AppRoot', () => {
  test('start and stop', async () => {
    const arbitrager = { start: jest.fn(), stop: jest.fn() };
    const container = {
      get: () => arbitrager
    };
    const target = new AppRoot(container);
    await target.start();
    expect(arbitrager.start).toBeCalled();
    await target.stop();
    expect(arbitrager.stop).toBeCalled();
  });

  test('start throws', async () => {
    const arbitrager = {
      start: async () => { throw new Error('Mock start failed.'); }, stop: jest.fn()
    };
    const container = {
      get: () => arbitrager
    };
    const target = new AppRoot(container);
    await target.start();
  });

  test('stop throws', async () => {
    const arbitrager = {
      start: jest.fn(), stop: async () => { throw new Error('Mock stop failed.'); }
    };    
    const container = {
      get: () => arbitrager
    };
    const target = new AppRoot(container);
    await target.start();
    await target.stop();
  });

  test('stop with undefined arbitrager', async () => {
    const arbitrager = { start: jest.fn(), stop: jest.fn() };
    const container = {
      get: () => arbitrager
    };
    const target = new AppRoot(container);
    await target.stop();
  });

  test('instantiate with default param', () => {
    const target = new AppRoot();
  });
});