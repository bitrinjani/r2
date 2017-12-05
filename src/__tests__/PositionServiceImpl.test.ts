import 'reflect-metadata';
import PositionServiceImpl from '../PositionServiceImpl';
import { Broker } from '../type';
import * as _ from 'lodash';
import { delay } from '../util';

const config = {
  minSize: 0.01,
  positionRefreshInterval: 5000,
  brokers: [{
    broker: Broker.Quoine,
    enabled: true,
    maxLongPosition: 0.3,
    maxShortPosition: 0
  }, {
    broker: Broker.Coincheck,
    enabled: true,
    maxLongPosition: 1,
    maxShortPosition: 0
  }]
};

const configStore = { config };
const baRouter = {
  getBtcPosition: broker => broker === Broker.Quoine ? 0.2 : -0.3
};

describe('Position Service', () => {
  test('positions', async () => {
    const ps = new PositionServiceImpl(configStore, baRouter);
    ps.print();
    await ps.start();
    const positions = _.values(ps.positionMap);
    const exposure = ps.netExposure;
    ps.print();
    await ps.stop();
    const ccPos = _.find(positions, x => x.broker === Broker.Coincheck);
    expect(positions.length).toBe(2);
    expect(exposure).toBe(-0.1);
    expect(ccPos.btc).toBe(-0.3);
    expect(ccPos.longAllowed).toBe(true);
    expect(ccPos.shortAllowed).toBe(false);
    expect(ccPos.allowedLongSize).toBe(1.3);
    expect(ccPos.allowedShortSize).toBe(0);
    const qPos = _.find(positions, x => x.broker === Broker.Quoine);
    expect(qPos.btc).toBe(0.2);
    expect(qPos.longAllowed).toBe(true);
    expect(qPos.shortAllowed).toBe(true);
    expect(qPos.allowedLongSize).toBe(0.1);
    expect(qPos.allowedShortSize).toBe(0.2);
  });

  test('positions throws', async () => {
    const baRouterThrows = { getBtcPosition: async () => { throw new Error('Mock refresh error.'); } };
    const ps = new PositionServiceImpl(configStore, baRouterThrows);
    ps.print();
    await ps.start();
    expect(ps.positionMap).toBeUndefined();
    expect(ps.netExposure).toBe(0);
    await ps.stop();
  });

  test('positions smaller than minSize', async () => {
    const baRouter = {
      getBtcPosition: broker => broker === Broker.Quoine ? 0.000002 : -0.3
    };
    const ps = new PositionServiceImpl(configStore, baRouter);
    ps.print();
    await ps.start();
    const positions = _.values(ps.positionMap);
    const exposure = ps.netExposure;
    ps.print();
    await ps.stop();
    const ccPos = _.find(positions, x => x.broker === Broker.Coincheck);
    expect(positions.length).toBe(2);
    expect(exposure).toBe(-0.299998);
    expect(ccPos.btc).toBe(-0.3);
    expect(ccPos.longAllowed).toBe(true);
    expect(ccPos.shortAllowed).toBe(false);
    expect(ccPos.allowedLongSize).toBe(1.3);
    expect(ccPos.allowedShortSize).toBe(0);
    const qPos = _.find(positions, x => x.broker === Broker.Quoine);
    expect(qPos.btc).toBe(0.000002);
    expect(qPos.longAllowed).toBe(true);
    expect(qPos.shortAllowed).toBe(false);
    expect(qPos.allowedLongSize).toBe(0.299998);
    expect(qPos.allowedShortSize).toBe(0.000002);
  });

  test('already refreshing block', async () => {
    config.positionRefreshInterval = 1;
    const ps = new PositionServiceImpl(configStore, baRouter);
    ps.isRefreshing = true;
    await ps.start();
    await ps.stop();
    expect(ps.positionMap).toBe(undefined);
  });

  test('setInterval triggered', async () => {
    config.positionRefreshInterval = 10;
    const ps = new PositionServiceImpl(configStore, baRouter);
    await ps.start();
    await delay(10);
    await ps.stop();
    const positions = _.values(ps.positionMap);
    expect(positions.length).toBe(2);
  });

  test('stop without start', async () => {
    const ps = new PositionServiceImpl(configStore, baRouter);
    ps.stop(); 
  };
});