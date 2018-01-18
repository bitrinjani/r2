import { Container } from 'inversify';
import AppRoot from '../AppRoot';
import { options } from '@bitr/logger';
import { getConfigRoot } from '../configUtil';
import symbols from '../symbols';
options.enabled = false;

describe('AppRoot', () => {
  test('start and stop', async () => {
    const service = { start: jest.fn(), stop: jest.fn() };
    const container = new Container();
    container.get = symbol => {
      if (symbol === symbols.ConfigStore) {
        return { config: { brokers: [{ broker: 'Bitflyer' }, { broker: 'Coincheck' }, { broker: 'Quoine' }] } };
      }
      return service;
    };
    const target = new AppRoot(container);
    await target.start();
    expect(service.start).toBeCalled();
    await target.stop();
    expect(service.stop).toBeCalled();
  });

  test('unknown broker', async () => {
    const service = { start: jest.fn(), stop: jest.fn() };
    const container = new Container();
    container.get = symbol => {
      if (symbol === symbols.ConfigStore) {
        return { config: { brokers: [{ broker: 'Unknown' }, { broker: 'Coincheck' }, { broker: 'Quoine' }] } };
      }
      return service;
    };
    const target = new AppRoot(container);
    await target.start();
    expect(service.start).not.toBeCalled();
  });

  test('unknown broker with npmPath', async () => {
    const service = { start: jest.fn(), stop: jest.fn() };
    const container = new Container();
    container.get = symbol => {
      if (symbol === symbols.ConfigStore) {
        return {
          config: {
            brokers: [{ broker: 'Unknown', npmPath: 'Unknown' }, { broker: 'Coincheck' }, { broker: 'Quoine' }]
          }
        };
      }
      return service;
    };
    const target = new AppRoot(container);
    await target.start();
    expect(service.start).not.toBeCalled();
  });

  test('unknown broker with wrong npmPath', async () => {
    const service = { start: jest.fn(), stop: jest.fn() };
    const container = new Container();
    container.get = symbol => {
      if (symbol === symbols.ConfigStore) {
        return {
          config: {
            brokers: [{ broker: 'Unknown', npmPath: '@bitr/castable' }, { broker: 'Coincheck' }, { broker: 'Quoine' }]
          }
        };
      }
      return service;
    };
    const target = new AppRoot(container);
    await target.start();
    expect(service.start).not.toBeCalled();
  });

  test('start throws', async () => {
    const service = {
      start: async () => {
        throw new Error('Mock start failed.');
      },
      stop: jest.fn()
    };
    const container = new Container();
    container.get = symbol => {
      if (symbol === symbols.ConfigStore) {
        return { config: { brokers: [{ broker: 'Bitflyer' }] } };
      }
      return service;
    };
    const target = new AppRoot(container);
    await target.start();
  });

  test('stop throws', async () => {
    const service = {
      start: jest.fn(),
      stop: async () => {
        throw new Error('Mock stop failed.');
      }
    };
    const container = new Container();
    container.get = symbol => {
      if (symbol === symbols.ConfigStore) {
        return { config: { brokers: [{ broker: 'Bitflyer' }] } };
      }
      return service;
    };
    const target = new AppRoot(container);
    await target.start();
    await target.stop();
  });

  test('stop with undefined arbitrager', async () => {
    const service = { start: jest.fn(), stop: jest.fn() };
    const container = new Container();
    container.get = symbol => {
      if (symbol === symbols.ConfigStore) {
        return { config: { brokers: [{ broker: 'Bitflyer' }] } };
      }
      return service;
    };
    const target = new AppRoot(container);
    await target.stop();
  });

  test('instantiate with default param', () => {
    const target = new AppRoot();
  });
});
