import 'reflect-metadata';
import JsonConfigStore from '../JsonConfigStore';
import { ConfigRoot } from '../types';
import { options } from '@bitr/logger';
import { delay } from '../util';
import * as _ from 'lodash';
import { Socket, socket } from 'zeromq';
import { configStoreSocketUrl } from '../constants';
import { ConfigRequester } from '../messages';
import { expect } from 'chai';
options.enabled = false;

function parseBuffer<T>(buffer: Buffer): T | undefined {
  try {
    return JSON.parse(buffer.toString());
  } catch (ex) {
    return undefined;
  }
}

describe('JsonConfigStore', () => {
  it('JsonConfigStore', async () => {
    const validator = { validate: (config: ConfigRoot) => true };
    const store = new JsonConfigStore(validator as any);
    // @ts-expect-error
    store.TTL = 5;
    expect(store.config.language).to.equal('en');
    expect(store.config.demoMode).to.equal(true);
    expect(store.config.priceMergeSize).to.equal(100);
    expect(store.config.brokers.length).to.equal(3);
    await delay(10);
    expect(store.config.brokers[0].broker).to.equal('Coincheck');
    expect(store.config.brokers[0].enabled).to.equal(false);
    expect(store.config.brokers[0].maxLongPosition).to.equal(0.3);
    expect(store.config.brokers[1].broker).to.equal('Bitflyer');
    expect(store.config.brokers[1].enabled).to.equal(true);
    expect(store.config.brokers[1].maxLongPosition).to.equal(0.2);
    store.close();
    await delay(10);
  });

  it('set', async () => {
    let store: JsonConfigStore;
    try {
      const validator = { validate: (config: ConfigRoot) => true };
      store = new JsonConfigStore(validator as any);
      // @ts-expect-error
      store.TTL = 5;
      expect(store.config.minSize).to.equal(0.01);
      await store.set(_.merge({}, store.config, { minSize: 0.001 }));
      expect(store.config.minSize).to.equal(0.001);
      await store.set(_.merge({}, store.config, { minSize: 0.01 }));
      expect(store.config.minSize).to.equal(0.01);
    } catch (ex) {
      console.log(ex);
      expect(true).to.equal(false);
    } finally {
      // @ts-expect-error
      if (store) {
        store.close();
      }
    }
  });

  it('server', async () => {
    let store: JsonConfigStore;
    let client: ConfigRequester;
    try {
      const validator = { validate: (config: ConfigRoot) => true };
      store = new JsonConfigStore(validator as any);
      // @ts-expect-error
      store.TTL = 5;
      expect(store.config.minSize).to.equal(0.01);

      client = new ConfigRequester(configStoreSocketUrl);
      await client.request({ type: 'set', data: { minSize: 0.002 } });
      expect(store.config.minSize).to.equal(0.002);

      await client.request({ type: 'set', data: { minSize: 0.01 } });
      expect(store.config.minSize).to.equal(0.01);
    } catch (ex) {
      console.log(ex);
      if (process.env.CI && ex.message === 'Address already in use') return;
      expect(true).to.equal(false);
    } finally {
      // @ts-expect-error
      store.close();
      // @ts-expect-error
      client.dispose();
    }
  });

  it('server: invalid message', async () => {
    let store: JsonConfigStore;
    let client: Socket;
    try {
      const validator = { validate: (config: ConfigRoot) => true };
      store = new JsonConfigStore(validator as any);
      // @ts-expect-error
      store.TTL = 5;
      expect(store.config.minSize).to.equal(0.01);

      client = socket('req');
      client.connect(configStoreSocketUrl);
      const reply = await new Promise<any>(resolve => {
        client.once('message', resolve);
        client.send('invalid message');
      });
      const parsed = JSON.parse(reply.toString());
      expect(parsed.success).to.equal(false);
      expect(parsed.reason).to.equal('invalid message');
      expect(store.config.minSize).to.equal(0.01);
    } catch (ex) {
      console.log(ex);
      if (process.env.CI && ex.message === 'Address already in use') return;
      expect(true).to.equal(false);
    } finally {
      // @ts-expect-error
      store.close();
      // @ts-expect-error
      client.close();
    }
  });

  it('server: configValidator throws', async () => {
    let store: JsonConfigStore;
    let client: ConfigRequester;
    try {
      const validator = {
        validate: (config: ConfigRoot) => {
          if (config.maxNetExposure <= 0) {
            throw new Error();
          }
          return true;
        }
      };
      store = new JsonConfigStore(validator as any);
      // @ts-expect-error
      store.TTL = 5;
      expect(store.config.minSize).to.equal(0.01);

      client = new ConfigRequester(configStoreSocketUrl);

      const reply = await client.request({ type: 'set', data: { maxNetExposure: -1 } });
      expect(reply.success).to.equal(false);
      expect(reply.reason).to.equal('invalid config');
      expect(store.config.minSize).to.equal(0.01);
    } catch (ex) {
      console.log(ex);
      if (process.env.CI && ex.message === 'Address already in use') return;
      expect(true).to.equal(false);
    } finally {
      // @ts-expect-error
      store.close();
      // @ts-expect-error
      client.dispose();
    }
  });

  it('server: invalid message type', async () => {
    let store: JsonConfigStore;
    let client: ConfigRequester;
    try {
      const validator = { validate: (config: ConfigRoot) => true };
      store = new JsonConfigStore(validator as any);
      // @ts-expect-error
      store.TTL = 5;
      expect(store.config.minSize).to.equal(0.01);

      client = new ConfigRequester(configStoreSocketUrl);

      const reply = await client.request({ type: 'invalid' });
      expect(reply.success).to.equal(false);
      expect(reply.reason).to.equal('invalid message type');
      expect(store.config.minSize).to.equal(0.01);
    } catch (ex) {
      console.log(ex);
      if (process.env.CI && ex.message === 'Address already in use') return;
      expect(true).to.equal(false);
    } finally {
      // @ts-expect-error
      if (store) store.close();
      // @ts-expect-error
      if (client) client.dispose();
    }
  });

  it('server: get', async () => {
    let store: JsonConfigStore;
    let client: ConfigRequester;
    try {
      const validator = { validate: (config: ConfigRoot) => true };
      store = new JsonConfigStore(validator as any);
      // @ts-expect-error
      store.TTL = 5;
      expect(store.config.minSize).to.equal(0.01);

      client = new ConfigRequester(configStoreSocketUrl);

      const reply = await client.request({ type: 'get' });
      expect(reply.success).to.equal(true);
      expect(reply.data?.minSize).to.equal(0.01);
      expect(store.config.minSize).to.equal(0.01);
    } catch (ex) {
      console.log(ex);
      if (process.env.CI && ex.message === 'Address already in use') return;
      expect(true).to.equal(false);
    } finally {
      // @ts-expect-error
      if (store) store.close();
      // @ts-expect-error
      if (client) client.dispose();
    }
  });
});
