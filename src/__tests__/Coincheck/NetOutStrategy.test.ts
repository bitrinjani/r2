import { CashMarginType, OrderSide, OrderType, Broker, OrderStatus } from '../../types';
import NetOutStrategy from '../../Coincheck/NetOutStrategy';
import BrokerApi from '../../Coincheck/BrokerApi';
import nocksetup from './nocksetup';
import OrderImpl from '../../OrderImpl';
import { NewOrderRequest } from '../../Coincheck/types';
import * as nock from 'nock';
import { options } from '@bitr/logger';
import { createOrder } from '../helper';
options.enabled = false;

nocksetup();

describe('NetOutStrategy', () => {
  test('getBtcPosition Margin', async () => {
    const strategy = new NetOutStrategy(new BrokerApi('', ''));
    const result = await strategy.getBtcPosition();
    expect(result).toBe(-0.14007);
  });

  test('send fails - not NetOut order', async () => {
    const strategy = new NetOutStrategy(new BrokerApi('', ''));
    const order = createOrder(
      'Coincheck',
      OrderSide.Buy,
      0.005,
      300000,
      CashMarginType.MarginOpen, OrderType.Limit, undefined);
    try {
      await strategy.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('netout close_short', async () => {
    const strategy = new NetOutStrategy(new BrokerApi('', ''));
    const order = createOrder(
      'Coincheck',
      OrderSide.Buy, 
      0.01, 
      840000, 
      CashMarginType.NetOut, 
      OrderType.Limit, 
      undefined
    );
    const request: NewOrderRequest = await strategy.getNetOutRequest(order);
    expect(request.order_type).toBe('close_short');
    expect(request.amount).toBe(0.010005);
    expect(request.position_id).toBe(2389078);
    await strategy.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('391699747');
  });

  test('netout request - open buy', async () => {
    const strategy = new NetOutStrategy(new BrokerApi('', ''));
    const order = createOrder(
      'Coincheck',
      OrderSide.Buy, 
      0.02, 
      840000, 
      CashMarginType.NetOut, 
      OrderType.Limit, 
      undefined
    );
    const request: NewOrderRequest = await strategy.getNetOutRequest(order);
    expect(request.order_type).toBe('leverage_buy');
    expect(request.amount).toBe(0.02);
    expect(request.position_id).toBe(undefined);
  });

  test('netout when no closable position', async () => {
    const strategy = new NetOutStrategy(new BrokerApi('', ''));
    const order = createOrder(
      'Coincheck', 
      OrderSide.Sell, 
      0.01, 
      830000, 
      CashMarginType.NetOut, 
      OrderType.Limit, 
      undefined
    );
    const request: NewOrderRequest = await strategy.getNetOutRequest(order);
    expect(request.order_type).toBe('leverage_sell');
    expect(request.amount).toBe(0.01);
    expect(request.position_id).toBeUndefined();
    await strategy.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('391697892');
  });

  test('netout market when no closable position', async () => {
    const strategy = new NetOutStrategy(new BrokerApi('', ''));
    const order = createOrder(
      'Coincheck', 
      OrderSide.Sell, 
      0.01, 
      830000, 
      CashMarginType.NetOut, 
      OrderType.Market, 
      undefined
    );
    const request: NewOrderRequest = await strategy.getNetOutRequest(order);
    expect(request.order_type).toBe('leverage_sell');
    expect(request.amount).toBe(0.01);
    expect(request.position_id).toBeUndefined();
    expect(request.rate).toBeUndefined();
  });

  test('netout non BTC/JPY', async () => {
    const strategy = new NetOutStrategy(new BrokerApi('', ''));
    const order = createOrder(
      'Coincheck', 
      OrderSide.Sell, 
      0.01, 
      830000, 
      CashMarginType.NetOut, 
      OrderType.Limit, 
      undefined
    );
    order.symbol = 'ZZZJPY';
    const fn = jest.fn();
    try {
      await strategy.getNetOutRequest(order);
      expect(true).toBe(false);
    } catch (ex) {
      fn();
    }
    expect(fn.mock.calls.length).toBe(1);
  });

  afterAll(() => {
    nock.restore();
  });
});