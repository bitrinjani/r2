import BrokerStabilityTracker from '../BrokerStabilityTracker';
import { delay } from '../util';

describe('BrokerStabilityTracker', () => {
  test('start/stop', async () => {
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
    const bst = new BrokerStabilityTracker({ config });
    await bst.start();
    await bst.stop();
  });

  test('check stability', async () => {
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
    const bst = new BrokerStabilityTracker({ config });
    await bst.start();
    bst.decrement('dummy1');
    bst.decrement('dummy3');
    expect(bst.stability('dummy1')).toBe(9);
    expect(bst.isStable('dummy1')).toBe(true);    
    expect(bst.isStable('dummy3')).toBe(false);
    await delay(20);
    expect(bst.stability('dummy1')).toBe(10);    
    bst.decrement('dummy1');
    bst.decrement('dummy1');
    bst.decrement('dummy1');
    expect(bst.stability('dummy1')).toBe(7);
    expect(bst.isStable('dummy1')).toBe(false);
    await bst.stop();
  });

  test('start/stop with no config', async () => {
    const config = {
      brokers: [
        { broker: 'dummy1' },
        { broker: 'dummy2' }
      ]
    };
    const bst = new BrokerStabilityTracker({ config });
    await bst.start();
    await bst.stop();
  });

  test('start/stop with imcomplete config', async () => {
    const config = {
      stabilityTracker: {}
      brokers: [
        { broker: 'dummy1' },
        { broker: 'dummy2' }
      ]
    };
    const bst = new BrokerStabilityTracker({ config });
    await bst.start();
    expect(bst.isStable('dummy1')).toBe(true);
    await bst.stop();
  });
});