// tslint:disable
import * as nock from 'nock';
import * as _ from 'lodash';
import BrokerAdapterImpl from '../../src/Quoine/BrokerAdapterImpl';
import { OrderStatus, CashMarginType, OrderSide, OrderType, BrokerConfigType } from '../../src/types';
import nocksetup from './nocksetup';
import { options } from '@bitr/logger';
import { createOrder } from '../helper';
import { expect } from 'chai';
options.enabled = false;

const brokerConfig = {
  broker: 'Quoine',
  key: 'key',
  secret: 'secret',
  cashMarginType: CashMarginType.NetOut
} as BrokerConfigType;

describe('Quoine BrokerAdapter', function(){
  this.beforeAll(() => {
    nocksetup();
  });

  this.afterAll(() => {
    nock.restore();
  });

  it('send leverage buy limit', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = createOrder('Quoine', OrderSide.Buy, 0.01, 783000, CashMarginType.NetOut, OrderType.Limit, 10);
    await target.send(order);
    expect(order.status).to.equal(OrderStatus.New);
    expect(order.brokerOrderId).to.equal('118573146');
  });

  it('send cash buy limit', async () => {
    const config = {
      brokers: [{ broker: 'Quoine', key: 'key', secret: 'secret', cashMarginType: CashMarginType.Cash }]
    };
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = createOrder('Quoine', OrderSide.Buy, 0.01, 783000, CashMarginType.Cash, OrderType.Limit, 10);
    await target.send(order);
    expect(order.status).to.equal(OrderStatus.New);
    expect(order.brokerOrderId).to.equal('118573146');
  });

  it('send wrong broker order', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = { broker: 'Bitflyer' };
    try {
      await target.send(order as any);
    } catch (ex) {
      return;
    }
    expect(false).to.equal(true);
  });

  it('send wrong symbol', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = { broker: 'Quoine', symbol: 'ZZZ' };
    try {
      await target.send(order as any);
    } catch (ex) {
      return;
    }
    expect(false).to.equal(true);
  });

  it('send wrong order type', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = { broker: 'Quoine', symbol: 'BTC/JPY', type: OrderType.StopLimit };
    try {
      await target.send(order as any);
    } catch (ex) {
      return;
    }
    expect(false).to.equal(true);
  });

  it('send wrong margin type', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      broker: 'Quoine',
      symbol: 'BTC/JPY',
      type: OrderType.Market,
      cashMarginType: CashMarginType.MarginOpen
    };
    try {
      await target.send(order as any);
    } catch (ex) {
      return;
    }
    expect(false).to.equal(true);
  });

  it('fetchQuotes', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const result = await target.fetchQuotes();
    expect(result.length).to.equal(42);
    result.forEach(q => expect(q.broker).to.equal('Quoine'));
  });

  it('getBtcPosition Margin', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const result = await target.getBtcPosition();
    expect(result).to.equal(0.12);
  });

  it('getBtcPosition Cash', async () => {
    const cashConfig = {
      broker: 'Quoine',
      key: 'key',
      secret: 'secret',
      cashMarginType: CashMarginType.Cash
    } as BrokerConfigType;
    const target = new BrokerAdapterImpl(cashConfig);
    const result = await target.getBtcPosition();
    expect(result).to.equal(0.04925688);
  });

  it('getBtcPosition strategy not found', async () => {
    const wrongConfig = {
      broker: 'Quoine',
      key: 'key',
      secret: 'secret',
      cashMarginType: CashMarginType.MarginOpen
    } as BrokerConfigType;
    const target = new BrokerAdapterImpl(wrongConfig);
    try {
      const result = await target.getBtcPosition();
    } catch (ex) {
      expect(ex.message).to.contain('Unable to find');
      return;
    }
    throw new Error();
  });

  it('getBtcPosition not found', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    try {
      const result = await target.getBtcPosition();
    } catch (ex) {
      return;
    }
    expect(false).to.equal(true);
  });

  it('refresh not filled', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: 'Limit',
      timeInForce: 'None',
      id: 'b28eaefe-84d8-4110-9917-0e9d5793d7eb',
      status: 'New',
      creationTime: '2017-11-06T23:46:56.635Z',
      executions: [],
      broker: 'Quoine',
      size: 0.01,
      side: 'Buy',
      price: 783000,
      cashMarginType: 'NetOut',
      leverageLevel: 10,
      brokerOrderId: '118573146',
      sentTime: '2017-11-06T23:46:56.692Z',
      lastUpdated: '2017-11-06T23:46:56.692Z'
    };
    await target.refresh(order as any);
    expect(order.status).to.equal(OrderStatus.New);
  });

  it('refresh partially filled', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: 'Limit',
      timeInForce: 'None',
      id: 'b28eaefe-84d8-4110-9917-0e9d5793d7eb',
      status: 'New',
      creationTime: '2017-11-06T23:46:56.635Z',
      executions: [],
      broker: 'Quoine',
      size: 0.01,
      side: 'Buy',
      price: 783000,
      cashMarginType: 'NetOut',
      leverageLevel: 10,
      brokerOrderId: '118573146',
      sentTime: '2017-11-06T23:46:56.692Z',
      lastUpdated: '2017-11-06T23:46:56.692Z'
    };
    await target.refresh(order as any);
    expect(order.status).to.equal(OrderStatus.PartiallyFilled);
  });

  it('refresh', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: 'Limit',
      timeInForce: 'None',
      id: 'b28eaefe-84d8-4110-9917-0e9d5793d7eb',
      status: 'New',
      creationTime: '2017-11-06T23:46:56.635Z',
      executions: [],
      broker: 'Quoine',
      size: 0.01,
      side: 'Buy',
      price: 783000,
      cashMarginType: 'NetOut',
      leverageLevel: 10,
      brokerOrderId: '118573146',
      sentTime: '2017-11-06T23:46:56.692Z',
      lastUpdated: '2017-11-06T23:46:56.692Z'
    };
    await target.refresh(order as any);
    expect(order.status).to.equal(OrderStatus.Filled);
  });

  it('cancel', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: 'Limit',
      timeInForce: 'None',
      id: 'b28eaefe-84d8-4110-9917-0e9d5793d7eb',
      status: 'New',
      creationTime: '2017-11-06T23:46:56.635Z',
      executions: [],
      broker: 'Quoine',
      size: 0.01,
      side: 'Buy',
      price: 783000,
      cashMarginType: 'NetOut',
      leverageLevel: 10,
      brokerOrderId: '118573146',
      sentTime: '2017-11-06T23:46:56.692Z',
      lastUpdated: '2017-11-06T23:46:56.692Z'
    };
    await target.cancel(order as any);
    expect(order.status).to.equal(OrderStatus.Canceled);
  });
});
