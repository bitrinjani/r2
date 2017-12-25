// tslint:disable:object-literal-key-quotes
// tslint:disable:max-line-length
import * as nock from 'nock';
import * as _ from 'lodash';
import BrokerApi from '../../Coincheck/BrokerApi';
import nocksetup from './nocksetup';
import { options } from '../../logger';
options.enabled = false;

nocksetup();

describe('BrokerApi', () => {
  test('getAccountsBalance', async () => {
    const api = new BrokerApi('', '');
    const reply = await api.getAccountsBalance();
    expect(reply.btc).toBe(0.123);
    expect(reply.jpy).toBe(0.375);
  });

  test('getLeverageBalance', async () => {
    const api = new BrokerApi('', '');
    const reply = await api.getLeverageBalance();
    expect(reply.margin.jpy).toBeCloseTo(131767.22675655);
    expect(reply.margin_available.jpy).toBeCloseTo(116995.98446494);
    expect(reply.margin_level).toBeCloseTo(8.36743);
  });

  test('getLeveragePositions', async () => {
    const api = new BrokerApi('', '');
    const pos = await api.getLeveragePositions({ status: 'open' });
    expect(pos.success).toBe(true);
    expect(pos.pagination.limit).toBe(10);
    expect(pos.data.length).toBe(9);
    expect(pos.data[1].new_order.created_at.toISOString()).toBe('2017-10-20T22:41:59.000Z');
  });

  test('getLeveragePositions paging', async () => {
    const api = new BrokerApi('', '');
    const pos1 = await api.getLeveragePositions({ status: 'open', limit: 4, order: 'desc' });
    const pos2 = await api.getLeveragePositions({ status: 'open', limit: 4, order: 'desc', starting_after: _.last(pos1.data).id });
    const pos3 = await api.getLeveragePositions({ status: 'open', limit: 4, order: 'desc', starting_after: _.last(pos2.data).id });
    const positions = _.concat(pos1.data, pos2.data, pos3.data);
    expect(positions.length).toBe(9);
    expect(positions[1].new_order.created_at.toISOString()).toBe('2017-10-20T22:41:59.000Z');
  });

  test('getAllOpenLeveragePositions', async () => {
    const api = new BrokerApi('', '');
    const positions = await api.getAllOpenLeveragePositions(4);
    expect(positions.length).toBe(9);
    expect(positions[1].new_order.created_at.toISOString()).toBe('2017-10-20T22:41:59.000Z');
  });

  test('getAllOpenLeveragePositions cache', async () => {
    const api = new BrokerApi('', '');
    let positions = await api.getAllOpenLeveragePositions(4);
    expect(positions.length).toBe(9);
    expect(positions[1].new_order.created_at.toISOString()).toBe('2017-10-20T22:41:59.000Z');
    positions = await api.getAllOpenLeveragePositions(4);
    expect(positions.length).toBe(9);
    expect(positions[1].new_order.created_at.toISOString()).toBe('2017-10-20T22:41:59.000Z');
  });

  test('getOrderBooks', async () => {
    const api = new BrokerApi('', '');
    const orderBooks = await api.getOrderBooks();
    expect(orderBooks.asks.length).toBe(200);
    for (const pair of orderBooks.asks) {
      expect(_.isNumber(pair[0])).toBe(true);
      expect(_.isNumber(pair[1])).toBe(true);
      expect(pair[0] > 100000).toBe(true);
      expect(pair[1] < 100000).toBe(true);
    }
  });

  test('newOrder', async () => {
    const api = new BrokerApi('', '');
    const request = { pair: 'btc_jpy', order_type: 'leverage_buy', amount: '0.005', rate: '300000' };
    const reply = await api.newOrder(request);
    expect(reply.amount).toBe(0.005);
    expect(reply.rate).toBe(300000);
  });

  test('cancelOrder', async () => {
    const api = new BrokerApi('', '');
    const id = '340809935';
    const reply = await api.cancelOrder(id);
    expect(_.isString(reply.id)).toBe(true);
    expect(reply.id).toBe(id);
  });

  test('getOpenOrders', async () => {
    const api = new BrokerApi('', '');
    const openOrders = await api.getOpenOrders();
    expect(openOrders.orders.length).toBe(1);
    expect(openOrders.orders[0].id).toBe('347772269');
  });

  test('getTransactions', async () => {
    const api = new BrokerApi('', '');
    const reply = await api.getTransactions({ limit: 20, order: 'desc' });
    expect(reply.data.length === 20).toBe(true);
    expect(reply.pagination.limit).toBe(20);
    expect(typeof reply.data[0].id).toBe('string');
    expect(reply.data[0].created_at.getFullYear()).toBe(2017);
    expect(typeof reply.data[0].rate).toBe('number');
    expect(_.every(reply.data, d => _.inRange(d.rate, 500000, 700000))).toBe(true);
    expect(_.every(reply.data.filter(d => d.side === 'buy'), d => _.inRange(d.funds.btc, 0.001, 1))).toBe(true);
    expect(_.every(reply.data.filter(d => d.side === 'sell'), d => _.inRange(d.funds.btc, -1, -0.001))).toBe(true);
  });

  afterAll(() => {
    nock.restore();
  });
});
