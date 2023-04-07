import SingleLegHandler from '../singleLegHandler';
import { OnSingleLegConfig, OrderSide, CashMarginType, OrderType, OrderStatus } from '../types';
import OrderImpl from '../orderImpl';
import { options } from '@bitr/logger';
import { createOrder } from './helper';
import { expect, spy } from 'chai';
options.enabled = false;

it('handle cancel action', () => {
  const config = { action: 'Cancel' } as OnSingleLegConfig;
  const handler = new SingleLegHandler(undefined as any, { config: { symbol: 'BTC/JPY', onSingleLeg: config } } as any);
  expect(() => handler.handle(undefined as any, false)).not.to.throw();
});

it('handle undefined config', () => {
  const handler = new SingleLegHandler(undefined as any, { config: { symbol: 'BTC/JPY' } } as any);
  expect(() => handler.handle(undefined as any, false)).not.to.throw();
});

it('handle cancel + closable', () => {
  const config = { action: 'Cancel' } as OnSingleLegConfig;
  const handler = new SingleLegHandler(undefined as any, { config: { symbol: 'BTC/JPY', onSingleLeg: config } } as any);
  expect(() => handler.handle(undefined as any, true)).not.to.throw();
});

it('reverse fill', async () => {
  const config = { action: 'Reverse', options: { limitMovePercent: 1, ttl: 1 } };
  const baRouterSendArguments = [] as any[][];
  const baRouter = { send: spy((...args) => baRouterSendArguments.push(args)), refresh: spy(), cancel: spy() };
  const handler = new SingleLegHandler(baRouter as any, { config: { symbol: 'BTC/JPY', onSingleLeg: config } } as any);
  const buyLeg = createOrder('Dummy1', OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
  buyLeg.filledSize = 0.1;
  buyLeg.status = OrderStatus.Filled;
  const sellLeg = createOrder('Dummy2', OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
  sellLeg.filledSize = 0;
  sellLeg.status = OrderStatus.New;
  const orders = [buyLeg, sellLeg];
  const subOrders = await handler.handle(orders as any, false);
  const sentOrder = baRouterSendArguments[0][0] as OrderImpl;
  expect(sentOrder.size).to.equal(0.1);
  expect(sentOrder.broker).to.equal('Dummy1');
  expect(sentOrder.side).to.equal(OrderSide.Sell);
  expect(subOrders[0].size).to.equal(0.1);
  expect(subOrders[0].broker).to.equal('Dummy1');
  expect(subOrders[0].side).to.equal(OrderSide.Sell);
});

it('proceed fill', async () => {
  const config = { action: 'Proceed', options: { limitMovePercent: 1, ttl: 1 } };
  const baRouterSendArguments = [] as any[][];
  const baRouter = { send: spy((...args) => baRouterSendArguments.push(args)), refresh: spy(), cancel: spy() };
  const handler = new SingleLegHandler(baRouter as any, { config: { symbol: 'BTC/JPY', onSingleLeg: config } } as any);
  const buyLeg = createOrder('Dummy1', OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
  buyLeg.filledSize = 0.1;
  buyLeg.status = OrderStatus.Filled;
  const sellLeg = createOrder('Dummy2', OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
  sellLeg.filledSize = 0;
  sellLeg.status = OrderStatus.PartiallyFilled;
  const orders = [buyLeg, sellLeg];
  const subOrders = await handler.handle(orders as any, false);
  const sentOrder = baRouterSendArguments[0][0] as OrderImpl;
  expect(sentOrder.size).to.equal(0.1);
  expect(sentOrder.broker).to.equal('Dummy2');
  expect(sentOrder.side).to.equal(OrderSide.Sell);
  expect(subOrders[0].size).to.equal(0.1);
  expect(subOrders[0].broker).to.equal('Dummy2');
  expect(subOrders[0].side).to.equal(OrderSide.Sell);
});

it('reverse partial fill', async () => {
  const config = { action: 'Reverse', options: { limitMovePercent: 1, ttl: 1 } };
  const baRouterSendArguments = [] as any[][];
  const baRouter = { send: spy((...args) => baRouterSendArguments.push(args)), refresh: spy(), cancel: spy() };
  const handler = new SingleLegHandler(baRouter as any, { config: { symbol: 'BTC/JPY', onSingleLeg: config } } as any);
  const buyLeg = createOrder('Dummy1', OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
  buyLeg.filledSize = 0.1;
  buyLeg.status = OrderStatus.Filled;
  const sellLeg = createOrder('Dummy2', OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
  sellLeg.filledSize = 0.04;
  sellLeg.status = OrderStatus.PartiallyFilled;
  const orders = [buyLeg, sellLeg];
  const subOrders = await handler.handle(orders as any, false);
  const sentOrder = baRouterSendArguments[0][0] as OrderImpl;
  expect(sentOrder.size).to.equal(0.06);
  expect(sentOrder.broker).to.equal('Dummy1');
  expect(sentOrder.side).to.equal(OrderSide.Sell);
  expect(subOrders[0].size).to.equal(0.06);
  expect(subOrders[0].broker).to.equal('Dummy1');
  expect(subOrders[0].side).to.equal(OrderSide.Sell);
});

it('reverse partial < partial', async () => {
  const config = { action: 'Reverse', options: { limitMovePercent: 1, ttl: 1 } };
  const baRouterSendArguments = [] as any[][];
  const baRouter = { send: spy((...args) => baRouterSendArguments.push(args)), refresh: spy(), cancel: spy() };
  const handler = new SingleLegHandler(baRouter as any, { config: { symbol: 'BTC/JPY', onSingleLeg: config } } as any);
  const buyLeg = createOrder('Dummy1', OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
  buyLeg.filledSize = 0.01;
  buyLeg.status = OrderStatus.PartiallyFilled;
  const sellLeg = createOrder('Dummy2', OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
  sellLeg.filledSize = 0.04;
  sellLeg.status = OrderStatus.PartiallyFilled;
  const orders = [buyLeg, sellLeg];
  await handler.handle(orders as any, false);
  const sentOrder = baRouterSendArguments[0][0] as OrderImpl;
  expect(sentOrder.size).to.equal(0.03);
  expect(sentOrder.broker).to.equal('Dummy2');
  expect(sentOrder.side).to.equal(OrderSide.Buy);
});

it('reverse partial > partial', async () => {
  const config = { action: 'Reverse', options: { limitMovePercent: 1, ttl: 1 } };
  const baRouterSendArguments = [] as any[][];
  const baRouter = { send: spy((...args) => baRouterSendArguments.push(args)), refresh: spy(), cancel: spy() };
  const handler = new SingleLegHandler(baRouter as any, { config: { symbol: 'BTC/JPY', onSingleLeg: config } } as any);
  const buyLeg = createOrder('Dummy1', OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
  buyLeg.filledSize = 0.07;
  buyLeg.status = OrderStatus.PartiallyFilled;
  const sellLeg = createOrder('Dummy2', OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
  sellLeg.filledSize = 0.02;
  sellLeg.status = OrderStatus.PartiallyFilled;
  const orders = [buyLeg, sellLeg];
  await handler.handle(orders as any, false);
  const sentOrder = baRouterSendArguments[0][0] as OrderImpl;
  expect(sentOrder.size).to.equal(0.05);
  expect(sentOrder.broker).to.equal('Dummy1');
  expect(sentOrder.side).to.equal(OrderSide.Sell);
});

it('proceed partial fill', async () => {
  const config = { action: 'Proceed', options: { limitMovePercent: 1, ttl: 1 } };
  const baRouterSendArguments = [] as any[][];
  const baRouter = { send: spy((...args) => baRouterSendArguments.push(args)), refresh: spy(), cancel: spy() };
  const handler = new SingleLegHandler(baRouter as any, { config: { symbol: 'BTC/JPY', onSingleLeg: config } } as any);
  const buyLeg = createOrder('Dummy1', OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
  buyLeg.filledSize = 0.1;
  buyLeg.status = OrderStatus.Filled;
  const sellLeg = createOrder('Dummy2', OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
  sellLeg.filledSize = 0.04;
  sellLeg.status = OrderStatus.PartiallyFilled;
  const orders = [buyLeg, sellLeg];
  const subOrders = await handler.handle(orders as any, false);
  const sentOrder = baRouterSendArguments[0][0] as OrderImpl;
  expect(sentOrder.size).to.equal(0.06);
  expect(sentOrder.broker).to.equal('Dummy2');
  expect(sentOrder.side).to.equal(OrderSide.Sell);
  expect(subOrders[0].size).to.equal(0.06);
  expect(subOrders[0].broker).to.equal('Dummy2');
  expect(subOrders[0].side).to.equal(OrderSide.Sell);
});

it('proceed partial < partial', async () => {
  const config = { action: 'Proceed', options: { limitMovePercent: 1, ttl: 1 } };
  const baRouterSendArguments = [] as any[][];
  const baRouter = { send: spy((...args) => baRouterSendArguments.push(args)), refresh: spy(), cancel: spy() };
  const handler = new SingleLegHandler(baRouter as any, { config: { symbol: 'BTC/JPY', onSingleLeg: config } } as any);
  const buyLeg = createOrder('Dummy1', OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
  buyLeg.filledSize = 0.01;
  buyLeg.status = OrderStatus.PartiallyFilled;
  const sellLeg = createOrder('Dummy2', OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
  sellLeg.filledSize = 0.04;
  sellLeg.status = OrderStatus.PartiallyFilled;
  const orders = [buyLeg, sellLeg];
  await handler.handle(orders as any, false);
  const sentOrder = baRouterSendArguments[0][0] as OrderImpl;
  expect(sentOrder.size).to.equal(0.03);
  expect(sentOrder.broker).to.equal('Dummy1');
  expect(sentOrder.side).to.equal(OrderSide.Buy);
});

it('proceed partial > partial', async () => {
  const config = { action: 'Proceed', options: { limitMovePercent: 1, ttl: 1 } };
  const baRouterSendArguments = [] as any[][];
  const baRouter = { send: spy((...args) => baRouterSendArguments.push(args)), refresh: spy(), cancel: spy() };
  const handler = new SingleLegHandler(baRouter as any, { config: { symbol: 'BTC/JPY', onSingleLeg: config } } as any);
  const buyLeg = createOrder('Dummy1', OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
  buyLeg.filledSize = 0.09;
  buyLeg.status = OrderStatus.PartiallyFilled;
  const sellLeg = createOrder('Dummy2', OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
  sellLeg.filledSize = 0.05;
  sellLeg.status = OrderStatus.PartiallyFilled;
  const orders = [buyLeg, sellLeg];
  await handler.handle(orders as any, false);
  const sentOrder = baRouterSendArguments[0][0] as OrderImpl;
  expect(sentOrder.size).to.equal(0.04);
  expect(sentOrder.broker).to.equal('Dummy2');
  expect(sentOrder.side).to.equal(OrderSide.Sell);
});
