import AnalyticsService from '../analytics/AnalyticsService';
import { socket } from 'zeromq';
import { configStoreSocketUrl, reportServicePubUrl, reportServiceRepUrl } from '../constants';
import { delay } from '../util';
import { options } from '@bitr/logger';

options.enabled = true;

describe('AnalyticsService', () => {
  test('start/stop', async () => {
    const config = {
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 }
      }
    };
    const configServer = socket('rep');
    configServer.bindSync(configStoreSocketUrl);
    configServer.on('message', () => {
      configServer.send(JSON.stringify({ success: true, data: config }));
    });

    const rsPub = socket('pub');
    rsPub.bindSync(reportServicePubUrl);
    const rsRep = socket('rep');
    rsRep.bindSync(reportServiceRepUrl);
    rsRep.on('message', () => {
      rsRep.send(JSON.stringify({ success: true, data: [] }));
    });
    const as = new AnalyticsService();
    await as.start();
    await as.stop();
    configServer.unbindSync(configStoreSocketUrl);
    rsPub.unbindSync(reportServicePubUrl);
    rsRep.unbindSync(reportServiceRepUrl);
    configServer.close();
    rsPub.close();
    rsRep.close();
  });

  test('invalid config', async () => {
    const config = {
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 }
      }
    };
    const configServer = socket('rep');
    configServer.bindSync(configStoreSocketUrl);
    configServer.on('message', () => {
      configServer.send(JSON.stringify({ success: false, data: config }));
    });

    const rsPub = socket('pub');
    rsPub.bindSync(reportServicePubUrl);
    const rsRep = socket('rep');
    rsRep.bindSync(reportServiceRepUrl);
    rsRep.on('message', () => {
      rsRep.send(JSON.stringify({ success: true, data: undefined }));
    });
    const as = new AnalyticsService();
    try {
      await as.start();
      expect(true).toBe(false);
    } catch (ex) {
      expect(ex.message).toBe('Analytics failed to get the config.');
    } finally {
      await as.stop();
      configServer.unbindSync(configStoreSocketUrl);
      rsPub.unbindSync(reportServicePubUrl);
      rsRep.unbindSync(reportServiceRepUrl);
      configServer.close();
      rsPub.close();
      rsRep.close();
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
    const configServer = socket('rep');
    configServer.bindSync(configStoreSocketUrl);
    configServer.on('message', () => {
      configServer.send(JSON.stringify({ success: true, data: config }));
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
      expect(ex.message).toBe('Failed to parse the initial snapshot message.');
    } finally {
      await as.stop();
      configServer.unbindSync(configStoreSocketUrl);
      rsPub.unbindSync(reportServicePubUrl);
      rsRep.unbindSync(reportServiceRepUrl);
      configServer.close();
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
    const configServer = socket('rep');
    configServer.bindSync(configStoreSocketUrl);
    configServer.on('message', () => {
      configServer.send(JSON.stringify({ success: true, data: config }));
    });

    const rsPub = socket('pub');
    rsPub.bindSync(reportServicePubUrl);
    const rsRep = socket('rep');
    rsRep.bindSync(reportServiceRepUrl);
    rsRep.on('message', () => {
      rsRep.send(JSON.stringify({ success: true, data: [] }));
    });
    const as = new AnalyticsService();
    
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
    configServer.unbindSync(configStoreSocketUrl);
    rsPub.unbindSync(reportServicePubUrl);
    rsRep.unbindSync(reportServiceRepUrl);
    configServer.close();
    rsPub.close();
    rsRep.close();
  });

  test('stop message', async () => {
    const config = {
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 }
      }
    };
    const configServer = socket('rep');
    configServer.bindSync(configStoreSocketUrl);
    configServer.on('message', () => {
      configServer.send(JSON.stringify({ success: true, data: config }));
    });

    const rsPub = socket('pub');
    rsPub.bindSync(reportServicePubUrl);
    const rsRep = socket('rep');
    rsRep.bindSync(reportServiceRepUrl);
    rsRep.on('message', () => {
      rsRep.send(JSON.stringify({ success: true, data: [] }));
    });
    const as = new AnalyticsService();
    await as.start();    
    process.emit('message', 'invalid', undefined);
    process.emit('message', 'stop', undefined);
    configServer.unbindSync(configStoreSocketUrl);
    rsPub.unbindSync(reportServicePubUrl);
    rsRep.unbindSync(reportServiceRepUrl);
    configServer.close();
    rsPub.close();
    rsRep.close();
  });
});
