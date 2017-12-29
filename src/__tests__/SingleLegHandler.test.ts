import SingleLegHandler from '../SingleLegHandler';
import { OnSingleLegConfig, OrderSide, CashMarginType, OrderType, OrderStatus } from '../types';
import Order from '../Order';
import { options } from '../logger';
options.enabled = false;

test('handle cancel action', () => {
  const config = { action: 'Cancel' } as OnSingleLegConfig;
  const handler = new SingleLegHandler(undefined, config);
  expect(() => handler.handle(undefined, false)).not.toThrow();
});

test('handle undefined config', () => {
  const handler = new SingleLegHandler(undefined, undefined);
  expect(() => handler.handle(undefined, false)).not.toThrow();
});

test('handle undefined config', () => {
  const config = { action: 'Cancel' } as OnSingleLegConfig;
  const handler = new SingleLegHandler(undefined, config);
  expect(() => handler.handle(undefined, true)).not.toThrow();
});

test('reverse fill', async () => {
  const config = { action: 'Reverse', options: { limitMovePercent: 1, ttl: 1 } };
  const baRouter = { send: jest.fn(), refresh: jest.fn(), cancel: jest.fn() };
  const handler = new SingleLegHandler(baRouter, config);
  const buyLeg = new Order('Dummy1', OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
  buyLeg.filledSize = 0.1;
  buyLeg.status = OrderStatus.Filled;
  const sellLeg = new Order('Dummy2', OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
  sellLeg.filledSize = 0;
  sellLeg.status = OrderStatus.New;
  const orders = [buyLeg, sellLeg];
  const subOrders = await handler.handle(orders, false);
  const sentOrder = baRouter.send.mock.calls[0][0] as Order;
  expect(sentOrder.size).toBe(0.1);
  expect(sentOrder.broker).toBe('Dummy1');
  expect(sentOrder.side).toBe(OrderSide.Sell);
  expect(subOrders[0].size).toBe(0.1);
  expect(subOrders[0].broker).toBe('Dummy1');
  expect(subOrders[0].side).toBe(OrderSide.Sell);
});

test('proceed fill', async () => {
  const config = { action: 'Proceed', options: { limitMovePercent: 1, ttl: 1 } };
  const baRouter = { send: jest.fn(), refresh: jest.fn(), cancel: jest.fn() };
  const handler = new SingleLegHandler(baRouter, config);
  const buyLeg = new Order('Dummy1', OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
  buyLeg.filledSize = 0.1;
  buyLeg.status = OrderStatus.Filled;
  const sellLeg = new Order('Dummy2', OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
  sellLeg.filledSize = 0;
  sellLeg.status = OrderStatus.PartiallyFilled;
  const orders = [buyLeg, sellLeg];
  const subOrders = await handler.handle(orders, false);
  const sentOrder = baRouter.send.mock.calls[0][0] as Order;
  expect(sentOrder.size).toBe(0.1);
  expect(sentOrder.broker).toBe('Dummy2');
  expect(sentOrder.side).toBe(OrderSide.Sell);
  expect(subOrders[0].size).toBe(0.1);
  expect(subOrders[0].broker).toBe('Dummy2');
  expect(subOrders[0].side).toBe(OrderSide.Sell);
});

test('reverse partial fill', async () => {
  const config = { action: 'Reverse', options: { limitMovePercent: 1, ttl: 1 } };
  const baRouter = { send: jest.fn(), refresh: jest.fn(), cancel: jest.fn() };
  const handler = new SingleLegHandler(baRouter, config);
  const buyLeg = new Order('Dummy1', OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
  buyLeg.filledSize = 0.1;
  buyLeg.status = OrderStatus.Filled;
  const sellLeg = new Order('Dummy2', OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
  sellLeg.filledSize = 0.04;
  sellLeg.status = OrderStatus.PartiallyFilled;
  const orders = [buyLeg, sellLeg];
  const subOrders = await handler.handle(orders, false);
  const sentOrder = baRouter.send.mock.calls[0][0] as Order;
  expect(sentOrder.size).toBe(0.06);
  expect(sentOrder.broker).toBe('Dummy1');
  expect(sentOrder.side).toBe(OrderSide.Sell);
  expect(subOrders[0].size).toBe(0.06);
  expect(subOrders[0].broker).toBe('Dummy1');
  expect(subOrders[0].side).toBe(OrderSide.Sell);
});

test('proceed partial fill', async () => {
  const config = { action: 'Proceed', options: { limitMovePercent: 1, ttl: 1 } };
  const baRouter = { send: jest.fn(), refresh: jest.fn(), cancel: jest.fn() };
  const handler = new SingleLegHandler(baRouter, config);
  const buyLeg = new Order('Dummy1', OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
  buyLeg.filledSize = 0.1;
  buyLeg.status = OrderStatus.Filled;
  const sellLeg = new Order('Dummy2', OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
  sellLeg.filledSize = 0.04;
  sellLeg.status = OrderStatus.PartiallyFilled;
  const orders = [buyLeg, sellLeg];
  const subOrders = await handler.handle(orders, false);
  const sentOrder = baRouter.send.mock.calls[0][0] as Order;
  expect(sentOrder.size).toBe(0.06);
  expect(sentOrder.broker).toBe('Dummy2');
  expect(sentOrder.side).toBe(OrderSide.Sell);
  expect(subOrders[0].size).toBe(0.06);
  expect(subOrders[0].broker).toBe('Dummy2');
  expect(subOrders[0].side).toBe(OrderSide.Sell);
});
