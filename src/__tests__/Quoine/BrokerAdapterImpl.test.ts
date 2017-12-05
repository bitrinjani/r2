// tslint:disable
import * as nock from 'nock';
import * as _ from 'lodash';
import BrokerAdapterImpl from '../../Quoine/BrokerAdapterImpl';
import { OrderStatus, Broker, CashMarginType, OrderSide, OrderType } from '../../type';
import nocksetup from './nocksetup';
import Order from '../../Order';

nocksetup();

const config = {
  brokers: [
    { broker: Broker.Quoine, key: 'key', secret: 'secret', cashMarginType: CashMarginType.NetOut }
  ]
};

describe('Quoine BrokerAdapter', () => {
  test('send leverage buy limit', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = new Order(
      Broker.Quoine,
      OrderSide.Buy,
      0.01,
      783000,
      CashMarginType.NetOut, OrderType.Limit, 10);
    await target.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('118573146');
    console.log(JSON.stringify(order));
  });

  test('send wrong broker order', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = { broker: Broker.Bitflyer };
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('send wrong symbol', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = { broker: Broker.Quoine, symbol: 'ZZZ' };
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('send wrong order type', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = { broker: Broker.Quoine, symbol: 'BTCJPY', type: OrderType.StopLimit };
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('send wrong margin type', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = { broker: Broker.Quoine, symbol: 'BTCJPY', type: OrderType.Market, cashMarginType: CashMarginType.MarginOpen };
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('fetchQuotes', async () => {
    const target = new BrokerAdapterImpl({ config });
    const result = await target.fetchQuotes();
    expect(result.length).toBe(42);
    result.forEach(q => expect(q.broker).toBe(Broker.Quoine));
  });

  test('fetchQuotes throws', async () => {
    const target = new BrokerAdapterImpl({ config });    
    const result = await target.fetchQuotes();
    expect(result.length).toBe(0);
  });

  test('getBtcPosition Margin', async () => {
    const target = new BrokerAdapterImpl({ config });
    const result = await target.getBtcPosition();
    expect(result).toBe(0.12);
  });

  test('getBtcPosition not found', async () => {
    const target = new BrokerAdapterImpl({ config });
    try {
      const result = await target.getBtcPosition();
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('refresh not filled', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = {
      "symbol": "BTCJPY", "type": "Limit", "timeInForce": "None", "id": "b28eaefe-84d8-4110-9917-0e9d5793d7eb", 
      "status": "New", "creationTime": "2017-11-06T23:46:56.635Z",
      "executions": [], "broker": "Quoine", "size": 0.01, "side": "Buy", "price": 783000, 
      "cashMarginType": "NetOut", "leverageLevel": 10, "brokerOrderId": "118573146", 
      "sentTime": "2017-11-06T23:46:56.692Z", "lastUpdated": "2017-11-06T23:46:56.692Z"
    };
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.New);
  });

  test('refresh partially filled', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = {
      "symbol": "BTCJPY", "type": "Limit", "timeInForce": "None", "id": "b28eaefe-84d8-4110-9917-0e9d5793d7eb", 
      "status": "New", "creationTime": "2017-11-06T23:46:56.635Z",
      "executions": [], "broker": "Quoine", "size": 0.01, "side": "Buy", "price": 783000, 
      "cashMarginType": "NetOut", "leverageLevel": 10, "brokerOrderId": "118573146", 
      "sentTime": "2017-11-06T23:46:56.692Z", "lastUpdated": "2017-11-06T23:46:56.692Z"
    };
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.PartiallyFilled);
  });

  test('refresh', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = {
      "symbol": "BTCJPY", "type": "Limit", "timeInForce": "None", "id": "b28eaefe-84d8-4110-9917-0e9d5793d7eb", 
      "status": "New", "creationTime": "2017-11-06T23:46:56.635Z",
      "executions": [], "broker": "Quoine", "size": 0.01, "side": "Buy", "price": 783000, 
      "cashMarginType": "NetOut", "leverageLevel": 10, "brokerOrderId": "118573146", 
      "sentTime": "2017-11-06T23:46:56.692Z", "lastUpdated": "2017-11-06T23:46:56.692Z"
    };
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.Filled);
  });

  test('cancel', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = {
      "symbol": "BTCJPY", "type": "Limit", "timeInForce": "None", "id": "b28eaefe-84d8-4110-9917-0e9d5793d7eb", 
      "status": "New", "creationTime": "2017-11-06T23:46:56.635Z",
      "executions": [], "broker": "Quoine", "size": 0.01, "side": "Buy", "price": 783000, 
      "cashMarginType": "NetOut", "leverageLevel": 10, "brokerOrderId": "118573146", 
      "sentTime": "2017-11-06T23:46:56.692Z", "lastUpdated": "2017-11-06T23:46:56.692Z"
    };
    await target.cancel(order);
    expect(order.status).toBe(OrderStatus.Canceled);
  });
});