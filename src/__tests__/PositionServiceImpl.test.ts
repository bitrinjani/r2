import 'reflect-metadata';
import PositionService from '../PositionService';
import { Broker } from '../types';
import * as _ from 'lodash';
import { delay } from '../util';
import { options } from '@bitr/logger';
import BrokerStabilityTracker from '../BrokerStabilityTracker';
options.enabled = false;

const config = {
  symbol: 'BTC/JPY',
  minSize: 0.01,
  positionRefreshInterval: 5000,
  brokers: [
    {
      broker: 'Quoine',
      enabled: true,
      maxLongPosition: 0.3,
      maxShortPosition: 0
    },
    {
      broker: 'Coincheck',
      enabled: true,
      maxLongPosition: 1,
      maxShortPosition: 0
    }
  ]
};

const configStore = { config };
const baRouter = {
  getPositions: broker => (broker === 'Quoine' ? new Map([['BTC', 0.2]]) : new Map([['BTC', -0.3]]))
};
const bst = new BrokerStabilityTracker(configStore);

describe('Position Service', () => {
  test('positions', async () => {
    const ps = new PositionService(configStore, baRouter, bst);
    await ps.start();
    const positions = _.values(ps.positionMap);
    const exposure = ps.netExposure;
    ps.print();
    await ps.stop();
    const ccPos = _.find(positions, x => x.broker === 'Coincheck');
    expect(positions.length).toBe(2);
    expect(exposure).toBe(-0.1);
    expect(ccPos.baseCcyPosition).toBe(-0.3);
    expect(ccPos.longAllowed).toBe(true);
    expect(ccPos.shortAllowed).toBe(false);
    expect(ccPos.allowedLongSize).toBe(1.3);
    expect(ccPos.allowedShortSize).toBe(0);
    const qPos = _.find(positions, x => x.broker === 'Quoine');
    expect(qPos.baseCcyPosition).toBe(0.2);
    expect(qPos.longAllowed).toBe(true);
    expect(qPos.shortAllowed).toBe(true);
    expect(qPos.allowedLongSize).toBe(0.1);
    expect(qPos.allowedShortSize).toBe(0.2);
  });

  test('positions throws', async () => {
    const baRouterThrows = {
      getPositions: async () => {
        throw new Error('Mock refresh error.');
      }
    };
    const ps = new PositionService(configStore, baRouterThrows, bst);
    await ps.start();
    expect(ps.positionMap).toBeUndefined();
    expect(ps.netExposure).toBe(0);
    await ps.stop();
  });

  test('positions smaller than minSize', async () => {
    const baRouter = {
      getPositions: broker => (broker === 'Quoine' ? new Map([['BTC', 0.000002]]) : new Map([['BTC', -0.3]]))
    };
    const ps = new PositionService(configStore, baRouter, bst);
    await ps.start();
    const positions = _.values(ps.positionMap);
    const exposure = ps.netExposure;
    ps.print();
    await ps.stop();
    const ccPos = _.find(positions, x => x.broker === 'Coincheck');
    expect(positions.length).toBe(2);
    expect(exposure).toBe(-0.299998);
    expect(ccPos.baseCcyPosition).toBe(-0.3);
    expect(ccPos.longAllowed).toBe(true);
    expect(ccPos.shortAllowed).toBe(false);
    expect(ccPos.allowedLongSize).toBe(1.3);
    expect(ccPos.allowedShortSize).toBe(0);
    const qPos = _.find(positions, x => x.broker === 'Quoine');
    expect(qPos.baseCcyPosition).toBe(0.000002);
    expect(qPos.longAllowed).toBe(true);
    expect(qPos.shortAllowed).toBe(false);
    expect(qPos.allowedLongSize).toBe(0.299998);
    expect(qPos.allowedShortSize).toBe(0.000002);
  });

  test('already refreshing block', async () => {
    config.positionRefreshInterval = 1;
    const ps = new PositionService(configStore, baRouter, bst);
    ps.isRefreshing = true;
    await ps.start();
    await ps.stop();
    expect(ps.positionMap).toBe(undefined);
  });

  test('setInterval triggered', async () => {
    config.positionRefreshInterval = 10;
    const ps = new PositionService(configStore, baRouter, bst);
    await ps.start();
    await delay(10);
    await ps.stop();
    const positions = _.values(ps.positionMap);
    expect(positions.length).toBe(2);
  });

  test('stop without start', async () => {
    const ps = new PositionService(configStore, baRouter, bst);
    ps.stop();
  });

  test('no pos in getPositions', async () => {
    const config = {
      symbol: 'XXX/YYY',
      minSize: 0.01,
      positionRefreshInterval: 5000,
      brokers: [
        {
          broker: 'Quoine',
          enabled: true,
          maxLongPosition: 0.3,
          maxShortPosition: 0
        },
        {
          broker: 'Coincheck',
          enabled: true,
          maxLongPosition: 1,
          maxShortPosition: 0
        }
      ]
    };

    const configStore = { config };
    const baRouter = {
      getPositions: broker => (broker === 'Quoine' ? new Map([['BTC', 0.2]]) : new Map([['BTC', -0.3]]))
    };
    const bst = new BrokerStabilityTracker(configStore);
    const ps = new PositionService(configStore, baRouter, bst);
    await ps.start();
    const positions = _.values(ps.positionMap);
    expect(positions.length).toBe(0);
    await ps.stop();
  });
});
