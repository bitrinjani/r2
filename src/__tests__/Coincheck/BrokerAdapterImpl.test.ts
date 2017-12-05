// tslint:disable
import * as nock from 'nock';
import * as _ from 'lodash';
import BrokerAdapterImpl from '../../Coincheck/BrokerAdapterImpl';
import { OrderStatus, Broker, CashMarginType, OrderSide, OrderType } from '../../types';
import nocksetup from './nocksetup';
import Order from '../../Order';
import { NewOrderRequest } from '../../Coincheck/types';

nocksetup();

const config = {
  brokers: [
    { broker: Broker.Coincheck, key: '', secret: '', cashMarginType: CashMarginType.MarginOpen }
  ]
};

describe('Coincheck BrokerAdapter', () => {
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

  test('getBtcPosition Margin', async () => {
    const target = new BrokerAdapterImpl({ config });
    const result = await target.getBtcPosition();
    expect(result).toBe(-0.14007);
  });

  test('getBtcPosition Cash', async () => {
    const config = {
      brokers: [
        { broker: Broker.Coincheck, key: '', secret: '', cashMarginType: CashMarginType.Cash }
      ]
    };
    const target = new BrokerAdapterImpl({ config });
    const result = await target.getBtcPosition();
    expect(result).toBe(0.123);
  });

  test('fetchQuotes', async () => {
    const target = new BrokerAdapterImpl({ config });
    const result = await target.fetchQuotes();
    expect(result.length).toBe(200);
    result.forEach(q => expect(q.broker).toBe(Broker.Coincheck));
  });

  test('fetchQuotes throws', async () => {
    const target = new BrokerAdapterImpl({ config });
    const result = await target.fetchQuotes();
    expect(result.length).toBe(0);
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

  test('send leverage buy limit', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = new Order(
      Broker.Coincheck,
      OrderSide.Buy,
      0.005,
      300000,
      CashMarginType.MarginOpen, OrderType.Limit, undefined);
    await target.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('340622252');
  });

  test('send fails', async () => {
    const target = new BrokerAdapterImpl({ config });
    const order = new Order(
      Broker.Coincheck,
      OrderSide.Buy,
      0.005,
      300000,
      CashMarginType.MarginOpen, OrderType.Limit, undefined);
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

  test('netout close_short', async () => {
    const ba = new BrokerAdapterImpl({ config });
    const order = new Order(Broker.Coincheck, OrderSide.Buy, 0.01, 840000, CashMarginType.NetOut, OrderType.Limit, undefined);
    const request: NewOrderRequest = await ba.getNetOutRequest(order); //! testing private method
    expect(request.order_type).toBe('close_short');
    expect(request.amount).toBe(0.010005);
    expect(request.position_id).toBe(2389078);
    await ba.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('391699747');
  });

  test('netout when no closable position', async () => {
    const ba = new BrokerAdapterImpl({ config });
    const order = new Order(Broker.Coincheck, OrderSide.Sell, 0.01, 830000, CashMarginType.NetOut, OrderType.Limit, undefined);
    const request: NewOrderRequest = await ba.getNetOutRequest(order); //! testing private method
    expect(request.order_type).toBe('leverage_sell');
    expect(request.amount).toBe(0.01);
    expect(request.position_id).toBeUndefined();
    await ba.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('391697892');
  });
});

afterAll(() => {
  nock.restore();
});
