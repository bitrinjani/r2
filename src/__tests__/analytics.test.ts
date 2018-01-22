import AnalyticsService from '../analytics/AnalyticsService';
import { socket } from 'zeromq';
import { configStoreSocketUrl, reportServicePubUrl, reportServiceRepUrl } from '../constants';
import { delay } from '../util';
import { options } from '@bitr/logger';
import ZmqResponder from '@bitr/zmq/dist/ZmqResponder';
import { ConfigResponder, SnapshotResponder } from '../messages';

options.enabled = false;

describe('AnalyticsService', () => {
  test('start/stop', async () => {
    const config = {
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 }
      }
    };
    const configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
      respond({ success: true, data: config });
    });

    const rsPub = socket('pub');
    rsPub.bindSync(reportServicePubUrl);

    const rsRep = new SnapshotResponder(reportServiceRepUrl, (request, respond) => {
      respond({ success: true, data: [] });
    });

    try {
      const as = new AnalyticsService();
      await as.start();
      await as.stop();
      await delay(10);
    } catch (ex) {
      console.log(ex);
      if (process.env.CI && ex.message === 'address already in use') return;
      expect(true).toBe(false);
    } finally {
      rsPub.unbindSync(reportServicePubUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.dispose();
    }
  });

  test('invalid config', async () => {
    const config = {
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 }
      }
    };
    const configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
      respond({ success: false, data: config });
    });

    const rsPub = socket('pub');
    rsPub.bindSync(reportServicePubUrl);

    const rsRep = new SnapshotResponder(reportServiceRepUrl, (request, respond) => {
      respond({ success: true, data: undefined });
    });

    const as = new AnalyticsService();
    try {
      await as.start();
      expect(true).toBe(false);
    } catch (ex) {
      expect(ex.message).toBe('Analytics failed to get the config.');
    } finally {
      await as.stop();
      await delay(10);
      rsPub.unbindSync(reportServicePubUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.dispose();
    }
  });

  test('invalid config json', async () => {
    const config = {
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 }
      }
    };
    const configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
      respond({ success: true, data: config });
    });

    const rsPub = socket('pub');
    rsPub.bindSync(reportServicePubUrl);

    const rsRep = socket('rep');
    rsRep.bindSync(reportServiceRepUrl);
    rsRep.on('message', () => {
      rsRep.send('{invalid');
    });
    const as = new AnalyticsService();
    try {
      await as.start();
      expect(true).toBe(false);
    } catch (ex) {
      expect(ex.message).toBe('Invalid JSON string received.');
    } finally {
      await as.stop();
      await delay(10);
      rsPub.unbindSync(reportServicePubUrl);
      rsRep.unbindSync(reportServiceRepUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.close();
    }
  });

  test('handleStream', async () => {
    const config = {
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 }
      }
    };
    const configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
      respond({ success: true, data: config });
    });

    const rsPub = socket('pub');
    rsPub.bindSync(reportServicePubUrl);

    const rsRep = new SnapshotResponder(reportServiceRepUrl, (request, respond) => {
      respond({ success: true, data: [] });
    });

    const as = new AnalyticsService();
    try {
      await as.start();
      as.streamSubscriber.subscribe('sometopic');
      await delay(100);
      rsPub.send(['spreadStat', JSON.stringify({ pattern: 1 })]);
      rsPub.send(['spreadStat', 'handling']);
      await delay(100);
      rsPub.send(['spreadStat', JSON.stringify({ pattern: 2 })]);
      await delay(100);
      rsPub.send(['spreadStat', '{}']);
      await delay(100);
      rsPub.send(['spreadStat', 'invalid']);
      await delay(100);
      rsPub.send(['sometopic', 'invalid']);
      await delay(100);
      await as.stop();
      await delay(10);
    } catch (ex) {
      console.log(ex);
      if (process.env.CI && ex.message === 'address already in use') return;
      expect(true).toBe(false);
    } finally {
      rsPub.unbindSync(reportServicePubUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.dispose();
    }
  });

  test('stop message', async () => {
    const config = {
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 }
      }
    };
    const configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
      respond({ success: true, data: config });
    });

    const rsPub = socket('pub');
    rsPub.bindSync(reportServicePubUrl);

    const rsRep = new SnapshotResponder(reportServiceRepUrl, (request, respond) => {
      respond({ success: true, data: [] });
    });
    try {
      const as = new AnalyticsService();
      await as.start();
      process.emit('message', 'invalid', undefined);
      process.emit('message', 'stop', undefined);
      await delay(10);
    } catch (ex) {
      if (process.env.CI && ex.message === 'address already in use') return;
      expect(true).toBe(false);
    } finally {
      rsPub.unbindSync(reportServicePubUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.dispose();
    }
  });
});
