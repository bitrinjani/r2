// tslint:disable
import * as nock from 'nock';
import * as _ from 'lodash';
import BrokerAdapterImpl from '../../Coincheck/BrokerAdapterImpl';
import { OrderStatus, Broker, CashMarginType, OrderSide, OrderType, ConfigRoot } from '../../types';
import nocksetup from './nocksetup';
import Order from '../../Order';
import { NewOrderRequest } from '../../Coincheck/types';
import { options } from '../../logger';
options.enabled = false;

nocksetup();

const config = {
  brokers: [
    { broker: 'Coincheck', key: '', secret: '', cashMarginType: CashMarginType.MarginOpen }
  ]
} as ConfigRoot;

describe('Coincheck BrokerAdapter', () => {
  test('send with invalid cashMarginType', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = new Order(
      'Coincheck',
      OrderSide.Buy,
      0.005,
      300000,
      'Invalid' as CashMarginType, OrderType.Limit, undefined);
    try {
      await target.send(order);
      expect(true).toBe(false);
    } catch(ex) {
      return;
    }
    expect(true).toBe(false);
  });

  test('send leverage buy limit', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = new Order(
      'Coincheck',
      OrderSide.Buy,
      0.005,
      300000,
      CashMarginType.MarginOpen, OrderType.Limit, undefined);
    await target.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('340622252');
  });

  test('getBtcPosition with invalid cashMarginType', async () => {
    const config = {
      brokers: [
        { broker: 'Coincheck', key: '', secret: '', cashMarginType: 'Invalid' as CashMarginType }
      ]
    } as ConfigRoot;
    const target = new BrokerAdapterImpl({ config });
    try {
      await target.getBtcPosition();
      expect(true).toBe(false);
    } catch(ex) {
      return;
    }
    expect(true).toBe(false);
  });

  test('getBtcPosition leverage', async () => {
    const target = new BrokerAdapterImpl({ config });
    const result = await target.getBtcPosition();
    expect(result).toBe(-0.14007);
  });

  test('refresh', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = { "symbol": "BTCJPY", "type": "Limit", "timeInForce": "None", "id": "28f5d9f1-5e13-4bb7-845c-b1b7f02f5e64", "status": "New", "creationTime": "2017-10-28T01:20:39.320Z", "executions": [], "broker": "Coincheck", "size": 0.01, "side": "Buy", "price": 663000, "cashMarginType": "MarginOpen", "sentTime": "2017-10-28T01:20:39.236Z", "brokerOrderId": "361173028", "lastUpdated": "2017-10-28T01:20:39.416Z" };
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.Filled);
  });

  test('refresh partial fill', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = {
      "symbol": "BTCJPY", "type": "Limit", "timeInForce": "None", "id": "28f5d9f1-5e13-4bb7-845c-b1b7f02f5e64",
      "status": "New", "creationTime": "2017-10-28T01:20:39.320Z", "executions": [], "broker": "Coincheck",
      "size": 0.01, "side": "Buy", "price": 663000, "cashMarginType": "MarginOpen", "sentTime": "2017-10-28T01:20:39.236Z",
      "brokerOrderId": "361173028", "lastUpdated": "2017-10-28T01:20:39.416Z"
    };
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.PartiallyFilled);
  });

  test('refresh partial fill', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = {
      "symbol": "BTCJPY", "type": "Limit", "timeInForce": "None", "id": "28f5d9f1-5e13-4bb7-845c-b1b7f02f5e64",
      "status": "New", "creationTime": "2017-10-28T01:20:39.320Z", "executions": [], "broker": "Coincheck",
      "size": 0.01, "side": "Buy", "price": 663000, "cashMarginType": "MarginOpen", "sentTime": "2017-10-28T01:20:39.236Z",
      "brokerOrderId": "361173028", "lastUpdated": "2017-10-28T01:20:39.416Z"
    };
    try {
      await target.refresh(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('fetchQuotes', async () => {
    const target = new BrokerAdapterImpl({ config });
    const result = await target.fetchQuotes();
    expect(result.length).toBe(200);
    result.forEach(q => expect(q.broker).toBe('Coincheck'));
  });

  test('fetchQuotes throws', async () => {
    const target = new BrokerAdapterImpl({ config });
    const result = await target.fetchQuotes();
    expect(result.length).toBe(0);
  });

  test('send wrong broker order', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = { broker: 'Bitflyer' };
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('cancel', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = { brokerOrderId: '340809935' };
    await target.cancel(order);
    expect(order.status).toBe(OrderStatus.Canceled);
  });

  test('cancel failed', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = { brokerOrderId: '340809935' };
    try {
      await target.cancel(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });
});

afterAll(() => {
  nock.restore();
});
