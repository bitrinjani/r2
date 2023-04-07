import { expect } from 'chai';
import BrokerStabilityTracker from '../BrokerStabilityTracker';
import { delay } from '../util';

describe('BrokerStabilityTracker', () => {
  it('start/stop', async () => {
    const config = {
      stabilityTracker: {
        threshold: 8,
        recoveryInterval: 1000
      },
      brokers: [
        { broker: 'dummy1' },
        { broker: 'dummy2' }
      ]
    };
    const bst = new BrokerStabilityTracker({ config } as any);
    await bst.start();
    await bst.stop();
  });

  it('check stability', async () => {
    const config = {
      stabilityTracker: {
        threshold: 8,
        recoveryInterval: 5
      },
      brokers: [
        { broker: 'dummy1' },
        { broker: 'dummy2' }
      ]
    };
    const bst = new BrokerStabilityTracker({ config } as any);
    await bst.start();
    bst.decrement('dummy1');
    bst.decrement('dummy3');
    expect(bst.stability('dummy1')).to.equal(9);
    expect(bst.isStable('dummy1')).to.equal(true);    
    expect(bst.isStable('dummy3')).to.equal(false);
    await delay(20);
    expect(bst.stability('dummy1')).to.equal(10);    
    bst.decrement('dummy1');
    bst.decrement('dummy1');
    bst.decrement('dummy1');
    expect(bst.stability('dummy1')).to.equal(7);
    expect(bst.isStable('dummy1')).to.equal(false);
    await bst.stop();
  });

  it('start/stop with no config', async () => {
    const config = {
      brokers: [
        { broker: 'dummy1' },
        { broker: 'dummy2' }
      ]
    };
    const bst = new BrokerStabilityTracker({ config } as any);
    await bst.start();
    await bst.stop();
  });

  it('start/stop with imcomplete config', async () => {
    const config = {
      stabilityTracker: {},
      brokers: [
        { broker: 'dummy1' },
        { broker: 'dummy2' }
      ]
    };
    const bst = new BrokerStabilityTracker({ config } as any);
    await bst.start();
    expect(bst.isStable('dummy1')).to.equal(true);
    await bst.stop();
  });
});
