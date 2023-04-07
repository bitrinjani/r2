import AppRoot from '../AppRoot';
import { options } from '@bitr/logger';
import symbols from '../symbols';
import { expect, spy } from 'chai';
options.enabled = false;

describe('AppRoot', () => {
  it('start and stop', async () => {
    const service = { start: spy(), stop: spy() };
    const container = {} as any;
    container.get = symbol => {
      if (symbol === symbols.ConfigStore) {
        return { config: { brokers: [{ broker: 'Bitflyer' }, { broker: 'Coincheck' }, { broker: 'Quoine' }] } };
      }
      return service;
    };
    container.bind = () => {
      return { toConstantValue: spy() };
    };
    const target = new AppRoot(container);
    await target.start();
    expect(service.start).to.be.called();
    await target.stop();
    expect(service.stop).to.be.called();
  });

  it('unknown broker', async () => {
    const service = { start: spy(), stop: spy() };
    const container = {} as any;
    container.get = symbol => {
      if (symbol === symbols.ConfigStore) {
        return { config: { brokers: [{ broker: 'Unknown' }, { broker: 'Coincheck' }, { broker: 'Quoine' }] } };
      }
      return service;
    };
    container.bind = () => {
      return { toConstantValue: spy() };
    };
    const target = new AppRoot(container);
    await target.start();
    expect(service.start).not.to.be.called();
  });

  it('unknown broker with npmPath', async () => {
    const service = { start: spy(), stop: spy() };
    const container = {} as any;
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
    container.bind = () => {
      return { toConstantValue: spy() };
    };
    const target = new AppRoot(container);
    await target.start();
    expect(service.start).not.to.be.called();
  });

  it('unknown broker with wrong npmPath', async () => {
    const service = { start: spy(), stop: spy() };
    const container = {} as any;
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
    container.bind = () => {
      return { toConstantValue: spy() };
    };
    const target = new AppRoot(container);
    await target.start();
    expect(service.start).not.to.be.called();
  });

  it('start throws', async () => {
    const service = {
      start: async () => {
        throw new Error('Mock start failed.');
      },
      stop: spy()
    };
    const container = {} as any;
    container.get = symbol => {
      if (symbol === symbols.ConfigStore) {
        return { config: { brokers: [{ broker: 'Bitflyer' }] } };
      }
      return service;
    };
    container.bind = () => {
      return { toConstantValue: spy() };
    };
    const target = new AppRoot(container);
    await target.start();
  });

  it('stop throws', async () => {
    const service = {
      start: spy(),
      stop: async () => {
        throw new Error('Mock stop failed.');
      }
    };
    const container = {} as any;
    container.get = symbol => {
      if (symbol === symbols.ConfigStore) {
        return { config: { brokers: [{ broker: 'Bitflyer' }] } };
      }
      return service;
    };
    container.bind = () => {
      return { toConstantValue: spy() };
    };
    const target = new AppRoot(container);
    await target.start();
    await target.stop();
  });

  it('stop with undefined arbitrager', async () => {
    const service = { start: spy(), stop: spy() };
    const container = {} as any;
    container.get = symbol => {
      if (symbol === symbols.ConfigStore) {
        return { config: { brokers: [{ broker: 'Bitflyer' }] } };
      }
      return service;
    };
    container.bind = () => {
      return { toConstantValue: spy() };
    };
    const target = new AppRoot(container);
    await target.stop();
  });
});
