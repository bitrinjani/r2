import 'reflect-metadata';
import PositionService from '../src/positionService';
import * as _ from 'lodash';
import { delay } from '../src/util';
import { options } from '@bitr/logger';
import BrokerStabilityTracker from '../src/brokerStabilityTracker';
import { expect } from 'chai';
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
const bst = new BrokerStabilityTracker(configStore as any);

describe('Position Service', () => {
  it('positions', async () => {
    const ps = new PositionService(configStore as any, baRouter as any, bst as any);
    await ps.start();
    const positions = _.values(ps.positionMap);
    const exposure = ps.netExposure;
    ps.print();
    await ps.stop();
    const ccPos = _.find(positions, x => x.broker === 'Coincheck');
    expect(positions.length).to.equal(2);
    expect(exposure).to.equal(-0.1);
    expect(ccPos?.baseCcyPosition).to.equal(-0.3);
    expect(ccPos?.longAllowed).to.equal(true);
    expect(ccPos?.shortAllowed).to.equal(false);
    expect(ccPos?.allowedLongSize).to.equal(1.3);
    expect(ccPos?.allowedShortSize).to.equal(0);
    const qPos = _.find(positions, x => x.broker === 'Quoine');
    expect(qPos?.baseCcyPosition).to.equal(0.2);
    expect(qPos?.longAllowed).to.equal(true);
    expect(qPos?.shortAllowed).to.equal(true);
    expect(qPos?.allowedLongSize).to.equal(0.1);
    expect(qPos?.allowedShortSize).to.equal(0.2);
  });

  it('positions throws', async () => {
    const baRouterThrows = {
      getPositions: async () => {
        throw new Error('Mock refresh error.');
      }
    };
    const ps = new PositionService(configStore as any, baRouterThrows as any, bst as any);
    await ps.start();
    expect(ps.positionMap).to.equal(undefined);
    expect(ps.netExposure).to.equal(0);
    await ps.stop();
  });

  it('positions smaller than minSize', async () => {
    const baRouter = {
      getPositions: broker => (broker === 'Quoine' ? new Map([['BTC', 0.000002]]) : new Map([['BTC', -0.3]]))
    };
    const ps = new PositionService(configStore as any, baRouter as any, bst as any);
    await ps.start();
    const positions = _.values(ps.positionMap);
    const exposure = ps.netExposure;
    ps.print();
    await ps.stop();
    const ccPos = _.find(positions, x => x.broker === 'Coincheck');
    expect(positions.length).to.equal(2);
    expect(exposure).to.equal(-0.299998);
    expect(ccPos?.baseCcyPosition).to.equal(-0.3);
    expect(ccPos?.longAllowed).to.equal(true);
    expect(ccPos?.shortAllowed).to.equal(false);
    expect(ccPos?.allowedLongSize).to.equal(1.3);
    expect(ccPos?.allowedShortSize).to.equal(0);
    const qPos = _.find(positions, x => x.broker === 'Quoine');
    expect(qPos?.baseCcyPosition).to.equal(0.000002);
    expect(qPos?.longAllowed).to.equal(true);
    expect(qPos?.shortAllowed).to.equal(false);
    expect(qPos?.allowedLongSize).to.equal(0.299998);
    expect(qPos?.allowedShortSize).to.equal(0.000002);
  });

  it('already refreshing block', async () => {
    config.positionRefreshInterval = 1;
    const ps = new PositionService(configStore as any, baRouter as any, bst as any);
    ps["isRefreshing"] = true;
    await ps.start();
    await ps.stop();
    expect(ps.positionMap).to.equal(undefined);
  });

  it('setInterval triggered', async () => {
    config.positionRefreshInterval = 10;
    const ps = new PositionService(configStore as any, baRouter as any, bst as any);
    await ps.start();
    await delay(10);
    await ps.stop();
    const positions = _.values(ps.positionMap);
    expect(positions.length).to.equal(2);
  });

  it('stop without start', async () => {
    const ps = new PositionService(configStore as any, baRouter as any, bst as any);
    ps.stop();
  });

  it('no pos in getPositions', async () => {
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
    const bst = new BrokerStabilityTracker(configStore as any);
    const ps = new PositionService(configStore as any, baRouter as any, bst as any);
    await ps.start();
    const positions = _.values(ps.positionMap);
    expect(positions.length).to.equal(0);
    await ps.stop();
  });
});
