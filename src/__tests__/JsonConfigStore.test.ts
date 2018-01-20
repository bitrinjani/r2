import 'reflect-metadata';
import JsonConfigStore from '../JsonConfigStore';
import { ConfigStore, ConfigRoot, Broker } from '../types';
import { options } from '@bitr/logger';
import { delay, parseBuffer } from '../util';
import * as _ from 'lodash';
import { Socket, socket } from 'zeromq';
import { configStoreSocketUrl } from '../constants';
options.enabled = false;

describe('JsonConfigStore', () => {
  test('JsonConfigStore', async () => {
    const validator = { validate: (config: ConfigRoot) => true };
    const store = new JsonConfigStore(validator);
    store.TTL = 5;
    expect(store.config.language).toBe('en');
    expect(store.config.demoMode).toBe(true);
    expect(store.config.priceMergeSize).toBe(100);
    expect(store.config.brokers.length).toBe(3);
    await delay(10);
    expect(store.config.brokers[0].broker).toBe('Coincheck');
    expect(store.config.brokers[0].enabled).toBe(false);
    expect(store.config.brokers[0].maxLongPosition).toBe(0.3);
    expect(store.config.brokers[1].broker).toBe('Bitflyer');
    expect(store.config.brokers[1].enabled).toBe(true);
    expect(store.config.brokers[1].maxLongPosition).toBe(0.2);
    store.close();
  });

  test('set', async () => {
    let store: JsonConfigStore;
    try {
      const validator = { validate: (config: ConfigRoot) => true };
      store = new JsonConfigStore(validator);
      store.TTL = 5;
      expect(store.config.minSize).toBe(0.01);
      await store.set(_.merge({}, store.config, { minSize: 0.001 }));
      expect(store.config.minSize).toBe(0.001);
      await store.set(_.merge({}, store.config, { minSize: 0.01 }));
      expect(store.config.minSize).toBe(0.01);
    } catch (ex) {
      console.log(ex);
      expect(true).toBe(false);
    } finally {
      store.close();
    }
  });

  test('server', async () => {
    let store: JsonConfigStore;
    let client: Socket;
    try {
      const validator = { validate: (config: ConfigRoot) => true };
      store = new JsonConfigStore(validator);
      store.TTL = 5;
      expect(store.config.minSize).toBe(0.01);

      client = socket('req');
      client.connect(configStoreSocketUrl);
      await new Promise(resolve => {
        client.on('message', resolve);
        client.send(JSON.stringify({ type: 'set', data: { minSize: 0.002 } }));
      });
      expect(store.config.minSize).toBe(0.002);

      await new Promise(resolve => {
        client.on('message', resolve);
        client.send(JSON.stringify({ type: 'set', data: { minSize: 0.01 } }));
      });
      expect(store.config.minSize).toBe(0.01);
    } catch (ex) {
      console.log(ex);
      expect(true).toBe(false);
    } finally {
      store.close();
      client.close();
    }
  });

  test('server: invalid message', async () => {
    let store: JsonConfigStore;
    let client: Socket;
    try {
      const validator = { validate: (config: ConfigRoot) => true };
      store = new JsonConfigStore(validator);
      store.TTL = 5;
      expect(store.config.minSize).toBe(0.01);

      client = socket('req');
      client.connect(configStoreSocketUrl);
      const reply = await new Promise(resolve => {
        client.once('message', resolve);
        client.send('invalid message');
      });
      const parsed = parseBuffer(reply);
      expect(parsed.success).toBe(false);
      expect(parsed.reason).toBe('invalid message');
      expect(store.config.minSize).toBe(0.01);
    } catch (ex) {
      console.log(ex);
      expect(true).toBe(false);
    } finally {
      store.close();
      client.close();
    }
  });

  test('server: configValidator throws', async () => {
    let store: JsonConfigStore;
    let client: Socket;
    try {
      const validator = { validate: (config: ConfigRoot) => {
        if (config.maxNetExposure <= 0) {
          throw new Error();
        }
        return true;
      } };
      store = new JsonConfigStore(validator);
      store.TTL = 5;
      expect(store.config.minSize).toBe(0.01);

      client = socket('req');
      client.connect(configStoreSocketUrl);
      const reply = await new Promise(resolve => {
        client.once('message', resolve);
        client.send(JSON.stringify({ type: 'set', data: { maxNetExposure: -1 } }));
      });
      const parsed = parseBuffer(reply);
      expect(parsed.success).toBe(false);
      expect(parsed.reason).toBe('invalid config');
      expect(store.config.minSize).toBe(0.01);
    } catch (ex) {
      console.log(ex);
      expect(true).toBe(false);
    } finally {
      store.close();
      client.close();
    }
  });

  test('server: invalid message type', async () => {
    let store: JsonConfigStore;
    let client: Socket;
    try {
      const validator = { validate: (config: ConfigRoot) => true };
      store = new JsonConfigStore(validator);
      store.TTL = 5;
      expect(store.config.minSize).toBe(0.01);

      client = socket('req');
      client.connect(configStoreSocketUrl);
      const reply = await new Promise(resolve => {
        client.once('message', resolve);
        client.send(JSON.stringify({ type: 'invalid' }));
      });
      const parsed = parseBuffer(reply);
      expect(parsed.success).toBe(false);
      expect(parsed.reason).toBe('invalid message type');
      expect(store.config.minSize).toBe(0.01);
    } catch (ex) {
      console.log(ex);
      expect(true).toBe(false);
    } finally {
      store.close();
      client.close();
    }
  });

  test('server: get', async () => {
    let store: JsonConfigStore;
    let client: Socket;
    try {
      const validator = { validate: (config: ConfigRoot) => true };
      store = new JsonConfigStore(validator);
      store.TTL = 5;
      expect(store.config.minSize).toBe(0.01);

      client = socket('req');
      client.connect(configStoreSocketUrl);
      const reply = await new Promise(resolve => {
        client.once('message', resolve);
        client.send(JSON.stringify({ type: 'get' }));
      });
      const parsed = parseBuffer(reply);
      expect(parsed.success).toBe(true);
      expect(parsed.data.minSize).toBe(0.01);
      expect(store.config.minSize).toBe(0.01);
    } catch (ex) {
      console.log(ex);
      expect(true).toBe(false);
    } finally {
      store.close();
      client.close();
    }
  });
});
