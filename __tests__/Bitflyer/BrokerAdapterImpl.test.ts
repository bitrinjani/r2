// tslint:disable
import * as nock from 'nock';
import * as _ from 'lodash';
import BrokerAdapterImpl from '../../Bitflyer/BrokerAdapterImpl';
import { OrderStatus, Broker, CashMarginType, OrderSide, OrderType, TimeInForce, BrokerConfigType } from '../../types';
import nocksetup from './nocksetup';
import OrderImpl from '../../OrderImpl';
import { options } from '@bitr/logger';
import { createOrder } from '../helper';
options.enabled = false;

nocksetup();
afterAll(() => {
  nock.restore();
});

const brokerConfig = {
  broker: 'Bitflyer',
  key: '',
  secret: '',
  cashMarginType: CashMarginType.Cash
} as BrokerConfigType;

describe('Bitflyer BrokerAdapter', () => {
  test('getBtcPosition', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const result = await target.getBtcPosition();
    expect(result).toBe(0.01084272);
  });

  test('getBtcPosition throws', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    try {
      const result = await target.getBtcPosition();
    } catch (ex) {
      expect(ex.message).toBe('Btc balance is not found.');
      return;
    }
    expect(false).toBe(true);
  });

  test('fetchQuotes', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const result = await target.fetchQuotes();
    expect(result.length).toBe(4);
    result.forEach(q => expect(q.broker).toBe('Bitflyer'));
  });

  test('fetchQuotes throws', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    try {
      const result = await target.fetchQuotes();
    } catch (ex) {
      return;
    }
    expect(true).toBe(false);
  });

  test('send wrong broker order', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = { broker: 'Coincheck' };
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('send wrong cashMarginType', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = { broker: 'Bitflyer', cashMarginType: CashMarginType.MarginOpen, symbol: 'ZZZ' };
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('send wrong symbol order', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = { broker: 'Bitflyer', cashMarginType: CashMarginType.Cash, symbol: 'ZZZ' };
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('send StopLimit order', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      broker: 'Bitflyer',
      cashMarginType: CashMarginType.Cash,
      symbol: 'BTC/JPY',
      type: OrderType.StopLimit
    };
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('send wrong time in force', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      broker: 'Bitflyer',
      cashMarginType: CashMarginType.Cash,
      symbol: 'BTC/JPY',
      type: OrderType.Market,
      timeInForce: 'MOCK'
    };
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('cancel', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = { symbol: 'BTC/JPY', brokerOrderId: 'JRF20150707-033333-099999' };
    await target.cancel(order);
    expect(order.status).toBe(OrderStatus.Canceled);
  });

  test('cancel wrong symbol', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = { symbol: 'MOCK' };
    try {
      await target.cancel(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('send buy limit', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = createOrder('Bitflyer', OrderSide.Buy, 0.1, 30000, CashMarginType.Cash, OrderType.Limit, undefined);
    await target.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('JRF20150707-050237-639234');
  });

  test('send buy limit Fok', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = createOrder('Bitflyer', OrderSide.Buy, 0.1, 30000, CashMarginType.Cash, OrderType.Limit, undefined);
    order.timeInForce = TimeInForce.Fok;
    await target.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('JRF20150707-050237-639234');
  });

  test('send buy limit Ioc', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = createOrder('Bitflyer', OrderSide.Buy, 0.1, 30000, CashMarginType.Cash, OrderType.Limit, undefined);
    order.timeInForce = TimeInForce.Ioc;
    await target.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('JRF20150707-050237-639234');
  });

  test('refresh', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: 'Limit',
      timeInForce: 'None',
      id: '438f7c7b-ed72-4719-935f-477ea043e2b0',
      status: 'New',
      creationTime: '2017-11-03T09:20:06.687Z',
      executions: [],
      broker: 'Bitflyer',
      size: 0.01,
      side: 'Sell',
      price: 846700,
      cashMarginType: 'Cash',
      brokerOrderId: 'JRF20171103-092007-284294',
      sentTime: '2017-11-03T09:20:07.292Z',
      lastUpdated: '2017-11-03T09:20:07.292Z'
    };
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.Filled);
  });

  test('refresh Expired', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: 'Limit',
      timeInForce: 'None',
      id: '438f7c7b-ed72-4719-935f-477ea043e2b0',
      status: 'New',
      creationTime: '2017-11-03T09:20:06.687Z',
      executions: [],
      broker: 'Bitflyer',
      size: 0.01,
      side: 'Sell',
      price: 846700,
      cashMarginType: 'Cash',
      brokerOrderId: 'JRF12345',
      sentTime: '2017-11-03T09:20:07.292Z',
      lastUpdated: '2017-11-03T09:20:07.292Z'
    };
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.Expired);
  });

  test('refresh Canceled', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: 'Limit',
      timeInForce: 'None',
      id: '438f7c7b-ed72-4719-935f-477ea043e2b0',
      status: 'New',
      creationTime: '2017-11-03T09:20:06.687Z',
      executions: [],
      broker: 'Bitflyer',
      size: 0.01,
      side: 'Sell',
      price: 846700,
      cashMarginType: 'Cash',
      brokerOrderId: 'JRF12345',
      sentTime: '2017-11-03T09:20:07.292Z',
      lastUpdated: '2017-11-03T09:20:07.292Z'
    };
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.Canceled);
  });

  test('refresh Partially filled', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: 'Limit',
      timeInForce: 'None',
      id: '438f7c7b-ed72-4719-935f-477ea043e2b0',
      status: 'New',
      creationTime: '2017-11-03T09:20:06.687Z',
      executions: [],
      broker: 'Bitflyer',
      size: 0.01,
      side: 'Sell',
      price: 846700,
      cashMarginType: 'Cash',
      brokerOrderId: 'JRF12345',
      sentTime: '2017-11-03T09:20:07.292Z',
      lastUpdated: '2017-11-03T09:20:07.292Z'
    };
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.PartiallyFilled);
  });

  test('refresh unknown order id', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: 'Limit',
      timeInForce: 'None',
      id: '438f7c7b-ed72-4719-935f-477ea043e2b0',
      status: 'New',
      creationTime: '2017-11-03T09:20:06.687Z',
      executions: [],
      broker: 'Bitflyer',
      size: 0.01,
      side: 'Sell',
      price: 846700,
      cashMarginType: 'Cash',
      brokerOrderId: 'MOCK',
      sentTime: '2017-11-03T09:20:07.292Z',
      lastUpdated: '2017-11-03T09:20:07.292Z'
    };
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.New);
  });
});
