import 'reflect-metadata';
import JsonConfigStore from '../JsonConfigStore';
import { ConfigStore, ConfigRoot, Broker } from '../types';
import { options } from '../logger';
options.enabled = false;

test('JsonConfigStore', () => {
  const validator = { validate: (config: ConfigRoot) => true };
  const store = new JsonConfigStore(validator) as ConfigStore;
  expect(store.config.language).toBe('en');
  expect(store.config.demoMode).toBe(true);
  expect(store.config.priceMergeSize).toBe(100);
  expect(store.config.brokers.length).toBe(3);
  expect(store.config.brokers[0].broker).toBe('Coincheck');
  expect(store.config.brokers[0].enabled).toBe(false);
  expect(store.config.brokers[0].maxLongPosition).toBe(0.30);
  expect(store.config.brokers[1].broker).toBe('Bitflyer');
  expect(store.config.brokers[1].enabled).toBe(true);
  expect(store.config.brokers[1].maxLongPosition).toBe(0.20);
});