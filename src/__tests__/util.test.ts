import * as util from '../util';
import { Broker } from '../types';

test('timestampToDate', () => {
  const dt = util.timestampToDate(1509586252);
  expect(dt.toISOString()).toBe('2017-11-02T01:30:52.000Z');
});

test('mkdir', () => {
  expect(() => util.mkdir(1)).toThrow();
});

test('nonce', () => {
  expect(util.nonce().length).toBe(19);
});

test('almostEqual', () => {
  expect(util.almostEqual(1, 1, 0)).toBe(true);
  expect(util.almostEqual(1, 1, 1)).toBe(true);
  expect(util.almostEqual(1, 0.99, 2)).toBe(true);
  expect(util.almostEqual(1.00001, 0.99, 2)).toBe(true);
  expect(util.almostEqual(1.50001, 0.99, 70)).toBe(true);  
  expect(util.almostEqual(1, -1, 1)).toBe(false);
  expect(util.almostEqual(1, -0.99, 2)).toBe(false);
  expect(util.almostEqual(1.00001, 0.99, 1)).toBe(false);
  expect(util.almostEqual(1, 0.99, 0.1)).toBe(false);
  expect(util.almostEqual(1.50001, 0.99, 20)).toBe(false);
});

test('readJsonFileSync with BOM', () => {
  const config = util.readJsonFileSync('./src/__tests__/config_test_bom.json');
  expect(config.language).toBe('en');
});

test('readJsonFileSync with no BOM', () => {
  const config = util.readJsonFileSync('./src/__tests__/config_test.json');
  expect(config.language).toBe('en');
});

test('findBrokerConfig with no config', () => {
  expect(() => util.findBrokerConfig({brokers: []}, Broker.Bitflyer)).toThrow();
});

test('safeQueryStringStringify', () => {
  const o = { a: 1, b: undefined };
  const result = util.safeQueryStringStringify(o);
  expect(result).toBe('a=1');
});

import * as logger from '../logger';
test('logger', () => {
  const log = logger.getLogger('');
  log.warn();
  log.info();
  log.error();
  log.debug();
  const log2 = logger.getLogger('');
  expect(log).toBe(log2);
});