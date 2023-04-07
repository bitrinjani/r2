import * as util from '../util';
import { Broker, OrderSide, CashMarginType, OrderType } from '../types';
import { findBrokerConfig } from '../configUtil';
import OrderImpl from '../orderImpl';
import { expect } from 'chai';


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

it('findBrokerConfig with no config', () => {
  expect(() => findBrokerConfig({ brokers: [] } as any, 'Bitflyer')).to.throw();
});

it('safeQueryStringStringify', () => {
  const o = { a: 1, b: undefined };
  const result = util.safeQueryStringStringify(o);
  expect(result).to.equal('a=1');
});
