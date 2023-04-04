import * as util from '../util';
import { Broker, OrderSide, CashMarginType, OrderType } from '../types';
import { findBrokerConfig } from '../configUtil';
import OrderImpl from '../OrderImpl';

test('timestampToDate', () => {
  const dt = util.timestampToDate(1509586252);
  expect(dt.toISOString()).toBe('2017-11-02T01:30:52.000Z');
});

test('nonce', async () => {
  const result = [];
  setTimeout(() => result.push(util.nonce()), 50);
  setTimeout(() => result.push(util.nonce()), 50);
  setTimeout(() => result.push(util.nonce()), 50);
  setTimeout(() => result.push(util.nonce()), 50);
  setTimeout(() => result.push(util.nonce()), 50);
  setTimeout(() => result.push(util.nonce()), 50);
  await util.delay(100);
  const resultSet = new Set(result);
  expect(result.length).toBe(6);
  expect(result.length).toBe(resultSet.size);
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
  expect(() => findBrokerConfig({ brokers: [] }, 'Bitflyer')).toThrow();
});

test('safeQueryStringStringify', () => {
  const o = { a: 1, b: undefined };
  const result = util.safeQueryStringStringify(o);
  expect(result).toBe('a=1');
});

test('cwd', () => {
  const tmp = process.env.NODE_ENV;
  process.env.NODE_ENV = '__test__';
  const dir = util.cwd();
  process.env.NODE_ENV = tmp;
});