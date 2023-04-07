import * as util from '../util';
import { Broker, OrderSide, CashMarginType, OrderType } from '../types';
import { findBrokerConfig } from '../configUtil';
import OrderImpl from '../OrderImpl';
import { expect } from 'chai';

it('timestampToDate', () => {
  const dt = util.timestampToDate(1509586252);
  expect(dt.toISOString()).to.equal('2017-11-02T01:30:52.000Z');
});

it('nonce', async () => {
  const result: string[] = [];
  setTimeout(() => result.push(util.nonce()), 50);
  setTimeout(() => result.push(util.nonce()), 50);
  setTimeout(() => result.push(util.nonce()), 50);
  setTimeout(() => result.push(util.nonce()), 50);
  setTimeout(() => result.push(util.nonce()), 50);
  setTimeout(() => result.push(util.nonce()), 50);
  await util.delay(100);
  const resultSet = new Set(result);
  expect(result.length).to.equal(6);
  expect(result.length).to.equal(resultSet.size);
});

it('almostEqual', () => {
  expect(util.almostEqual(1, 1, 0)).to.equal(true);
  expect(util.almostEqual(1, 1, 1)).to.equal(true);
  expect(util.almostEqual(1, 0.99, 2)).to.equal(true);
  expect(util.almostEqual(1.00001, 0.99, 2)).to.equal(true);
  expect(util.almostEqual(1.50001, 0.99, 70)).to.equal(true);
  expect(util.almostEqual(1, -1, 1)).to.equal(false);
  expect(util.almostEqual(1, -0.99, 2)).to.equal(false);
  expect(util.almostEqual(1.00001, 0.99, 1)).to.equal(false);
  expect(util.almostEqual(1, 0.99, 0.1)).to.equal(false);
  expect(util.almostEqual(1.50001, 0.99, 20)).to.equal(false);
});

it('readJsonFileSync with BOM', () => {
  const config = util.readJsonFileSync('./src/__tests__/config_test_bom.json');
  expect(config.language).to.equal('en');
});

it('readJsonFileSync with no BOM', () => {
  const config = util.readJsonFileSync('./src/__tests__/config_test.json');
  expect(config.language).to.equal('en');
});

it('findBrokerConfig with no config', () => {
  expect(() => findBrokerConfig({ brokers: [] } as any, 'Bitflyer')).to.throw();
});

it('safeQueryStringStringify', () => {
  const o = { a: 1, b: undefined };
  const result = util.safeQueryStringStringify(o);
  expect(result).to.equal('a=1');
});

it('cwd', () => {
  const tmp = process.env.NODE_ENV;
  process.env.NODE_ENV = '__test__';
  const dir = util.cwd();
  process.env.NODE_ENV = tmp;
});
