import { CashMarginType, OrderSide, OrderType, Broker, OrderStatus } from '../../types';
import CashStrategy from '../../Coincheck/CashStrategy';
import BrokerApi from '../../Coincheck/BrokerApi';
import nocksetup from './nocksetup';
import OrderImpl from '../../OrderImpl';
import * as nock from 'nock';
import { options } from '../../logger';
import { createOrder } from '../helper';
options.enabled = false;

nocksetup();

describe('CashStrategy', () => {
  test('send buy limit', async () => {
    const strategy = new CashStrategy(new BrokerApi('', ''));
    const order = createOrder(
      'Coincheck',
      OrderSide.Buy,
      0.005,
      300000,
      CashMarginType.Cash, OrderType.Limit, undefined);
    await strategy.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('12345');
  });

  test('send fails - not Cash order', async () => {
    const strategy = new CashStrategy(new BrokerApi('', ''));
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

  test('getBtcPosition', async () => {
    const strategy = new CashStrategy(new BrokerApi('', ''));
    const result = await strategy.getBtcPosition();
    expect(result).toBe(0.123);
  });

  test('cash market buy', () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Buy,
      type: OrderType.Market
    };
    const target = strategy.getBrokerOrderType(order);
    expect(target).toBe('market_buy');
  });

  test('cash limit buy', () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Buy,
      type: OrderType.Limit
    };
    const target = strategy.getBrokerOrderType(order);
    expect(target).toBe('buy');
  });

  test('cash invalid buy', () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Buy,
      type: OrderType.StopLimit
    };
    expect(() => strategy.getBrokerOrderType(order)).toThrow();
  });

  test('cash sell market', () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Sell,
      type: OrderType.Market
    };
    const target = strategy.getBrokerOrderType(order);
    expect(target).toBe('market_sell');
  });

  test('cash sell limit', () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Sell,
      type: OrderType.Limit
    };
    const target = strategy.getBrokerOrderType(order);
    expect(target).toBe('sell');
  });

  test('cash sell invalid', () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Sell,
      type: OrderType.Stop
    };
    expect(() => strategy.getBrokerOrderType(order)).toThrow();
  });

  test('cash invalid side', () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: 'Invalid',
      type: OrderType.Stop
    };
    expect(() => strategy.getBrokerOrderType(order)).toThrow();
  });

  afterAll(() => {
    nock.restore();
  });
});