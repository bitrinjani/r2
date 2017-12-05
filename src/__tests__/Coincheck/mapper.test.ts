import { getBrokerOrderType } from '../../coincheck/mapper';
import { CashMarginType, OrderSide, OrderType } from '../../types';

describe('getBrokerOrderType', () => {
  test('cash market buy', () => {
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Buy,
      type: OrderType.Market
    };
    const target = getBrokerOrderType(order);
    expect(target).toBe('market_buy');
  });

  test('cash limit buy', () => {
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Buy,
      type: OrderType.Limit
    };
    const target = getBrokerOrderType(order);
    expect(target).toBe('buy');
  });

  test('cash invalid buy', () => {
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Buy,
      type: OrderType.StopLimit
    };
    expect(() => getBrokerOrderType(order)).toThrow();
  });

  test('cash sell market', () => {
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Sell,
      type: OrderType.Market
    };
    const target = getBrokerOrderType(order);
    expect(target).toBe('market_sell');
  });

  test('cash sell limit', () => {
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Sell,
      type: OrderType.Limit
    };
    const target = getBrokerOrderType(order);
    expect(target).toBe('sell');
  });

  test('cash sell invalid', () => {
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: OrderSide.Sell,
      type: OrderType.Stop
    };
    expect(() => getBrokerOrderType(order)).toThrow();
  });

  test('cash invalid side', () => {
    const order = {
      cashMarginType: CashMarginType.Cash,
      side: 'Invalid',
      type: OrderType.Stop
    };
    expect(() => getBrokerOrderType(order)).toThrow();
  });

  test('open buy limit', () => {
    const order = {
      cashMarginType: CashMarginType.MarginOpen,
      side: OrderSide.Buy,
      type: OrderType.Limit
    };
    const target = getBrokerOrderType(order);
    expect(target).toBe('leverage_buy');
  });

  test('open sell limit', () => {
    const order = {
      cashMarginType: CashMarginType.MarginOpen,
      side: OrderSide.Sell,
      type: OrderType.Limit
    };
    const target = getBrokerOrderType(order);
    expect(target).toBe('leverage_sell');
  });

  test('open invalidside limit', () => {
    const order = {
      cashMarginType: CashMarginType.MarginOpen,
      side: 'Invalid',
      type: OrderType.Limit
    };
    expect(() => getBrokerOrderType(order)).toThrow();
  });

  test('close buy limit', () => {
    const order = {
      cashMarginType: CashMarginType.MarginClose,
      side: OrderSide.Buy,
      type: OrderType.Limit
    };
    const target = getBrokerOrderType(order);
    expect(target).toBe('close_short');
  });

  test('close sell limit', () => {
    const order = {
      cashMarginType: CashMarginType.MarginClose,
      side: OrderSide.Sell,
      type: OrderType.Limit
    };
    const target = getBrokerOrderType(order);
    expect(target).toBe('close_long');
  });

  test('close invalidside limit', () => {
    const order = {
      cashMarginType: CashMarginType.MarginClose,
      side: 'Invalid',
      type: OrderType.Limit
    };
    expect(() => getBrokerOrderType(order)).toThrow();
  });

  test('invalid CashMarginType', () => {
    const order = {
      cashMarginType: 'Invalid',
      side: OrderSide.Buy,
      type: OrderType.Limit
    };
    expect(() => getBrokerOrderType(order)).toThrow();
  });
});