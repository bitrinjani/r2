import AnalyticsService from '../analytics/AnalyticsService';
import { socket } from 'zeromq';
import { configStoreSocketUrl, reportServicePubUrl, reportServiceRepUrl } from '../src/constants';
import { delay } from '../src/util';
import { options } from '@bitr/logger';
import { ConfigResponder, SnapshotResponder } from '../src/messages';
import { expect } from 'chai';

options.enabled = false;

describe('AnalyticsService', () => {
  it('start/stop', async () => {
    const config = {
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 }
      }
    };

    let configServer, rsPub, rsRep, as;
    try {
      configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
        respond({ success: true, data: config } as any);
      });
  
      rsPub = socket('pub');
      rsPub.bindSync(reportServicePubUrl);
  
      rsRep = new SnapshotResponder(reportServiceRepUrl, (request, respond) => {
        respond({ success: true, data: [] });
      });
      as = new AnalyticsService();
      await as.start();
      await delay(10);
    } catch (ex) {
      console.log(ex);
      if (process.env.CI && ex.message === 'Address already in use') return;
      console.log(ex);
      expect(true).to.equal(false);
    } finally {
      rsPub.unbindSync(reportServicePubUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.dispose();
      if (as) await as.stop();
    }
  });

  it('snapshot fail', async () => {
    const config = {
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 }
      }
    };

    let configServer, rsPub, rsRep, as;
    try {
      configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
        respond({ success: true, data: config } as any);
      });

      rsPub = socket('pub');
      rsPub.bindSync(reportServicePubUrl);

      rsRep = new SnapshotResponder(reportServiceRepUrl, (request, respond) => {
        respond({ success: false, data: [] });
      });
      as = new AnalyticsService();
      await as.start();
    } catch (ex) {
      if (process.env.CI && ex.message === 'Address already in use') return;
      expect(ex.message).to.equal('Failed to initial snapshot message.');
    } finally {
      if (as) await as.stop();
      await delay(10);
      rsPub.unbindSync(reportServicePubUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.dispose();
    }
  });

  it('invalid config', async () => {
    const config = {
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 }
      }
    };
    let configServer, rsPub, rsRep, as;

    try {
      configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
        respond({ success: false, data: config } as any);
      });
  
      rsPub = socket('pub');
      rsPub.bindSync(reportServicePubUrl);
  
      rsRep = new SnapshotResponder(reportServiceRepUrl, (request, respond) => {
        respond({ success: true, data: undefined });
      });
  
      as = new AnalyticsService();
      await as.start();
      expect(true).to.equal(false);
    } catch (ex) {
      expect(ex.message).to.equal('Analytics failed to get the config.');
    } finally {
      if (as) await as.stop();
      await delay(10);
      rsPub.unbindSync(reportServicePubUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.dispose();
    }
  });

  it('invalid config json', async () => {
    const config = {
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 }
      }
    };

    let configServer, rsPub, rsRep, as;
    try {
      configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
        respond({ success: true, data: config } as any);
      });
  
      rsPub = socket('pub');
      rsPub.bindSync(reportServicePubUrl);
  
      rsRep = socket('rep');
      rsRep.bindSync(reportServiceRepUrl);
      rsRep.on('message', () => {
        rsRep.send('{invalid');
      });
      as = new AnalyticsService();
      await as.start();
      expect(true).to.equal(false);
    } catch (ex) {
      expect(ex.message).to.equal('Invalid JSON string received.');
    } finally {
      if (as) await as.stop();
      await delay(10);
      rsPub.unbindSync(reportServicePubUrl);
      rsRep.unbindSync(reportServiceRepUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.close();
    }
  });

  it('handleStream', async () => {
    const config = {
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 }
      }
    };
    let configServer, rsPub, rsRep, as;
    try {
      configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
        respond({ success: true, data: config } as any);
      });
  
      rsPub = socket('pub');
      rsPub.bindSync(reportServicePubUrl);
  
      rsRep = new SnapshotResponder(reportServiceRepUrl, (request, respond) => {
        respond({ success: true, data: [] });
      });
  
      as = new AnalyticsService();
      await as.start();
      as.streamSubscriber.subscribe('sometopic', message => console.log(message));
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

      await delay(10);
    } catch (ex) {
      console.log(ex);
      if (process.env.CI && ex.message === 'Address already in use') return;
      expect(true).to.equal(false);
    } finally {
      if (as) await as.stop();
      rsPub.unbindSync(reportServicePubUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.dispose();
    }
  });

  it('stop message', async () => {
    const config = {
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 }
      }
    };

    let configServer, rsPub, rsRep, as;
    try {
      configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
        respond({ success: true, data: config } as any);
      });
  
      rsPub = socket('pub');
      rsPub.bindSync(reportServicePubUrl);
  
      rsRep = new SnapshotResponder(reportServiceRepUrl, (request, respond) => {
        respond({ success: true, data: [] });
      });
      as = new AnalyticsService();
      await as.start();
      process.emit('message', 'invalid', undefined);
      process.emit('message', 'stop', undefined);
      await delay(10);
    } catch (ex) {
      if (process.env.CI && ex.message === 'Address already in use') return;
      expect(true).to.equal(false);
    } finally {
      if (as) await as.stop();
      rsPub.unbindSync(reportServicePubUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.dispose();
    }
  });
});
