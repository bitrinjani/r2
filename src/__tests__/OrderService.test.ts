import OrderService from '../OrderService';
import { HistoricalOrderStore, OrderSide, CashMarginType, OrderType, OrderStatus } from '../types';
import { delay } from '../util';

describe('OrderService', () => {
  const store = { put: jest.fn() };

  test('create, emitOrderUpdated, finalize', async () => {
    const os = new OrderService(store as any);
    const orderCreated = jest.fn();
    const orderUpdated = jest.fn();
    const orderFinalized = jest.fn();
    os.on('orderCreated', o => {
      orderCreated(o);
      console.log(o);
    });
    os.on('orderUpdated', orderUpdated);
    os.on('orderFinalized', orderFinalized);
    const order = os.createOrder({
      symbol: 'BTC/JPY',
      broker: 'Dummy',
      side: OrderSide.Buy,
      size: 0.001,
      price: 1000000,
      cashMarginType: CashMarginType.Cash,
      type: OrderType.Limit,
      leverageLevel: 1
    });
    await delay(0);
    expect(order.status).toBe(OrderStatus.PendingNew);
    expect(orderCreated).toBeCalled();

    order.status = OrderStatus.Filled;
    os.emitOrderUpdated(order);
    await delay(0);
    expect(orderUpdated.mock.calls[0][0].status).toBe(OrderStatus.Filled);

    os.finalizeOrder(order);
    await delay(0);
    expect(orderFinalized).toBeCalled();
  });
});
