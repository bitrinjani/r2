import { getHistoricalOrderStore } from '../HistoricalOrderStore';
import { ChronoDB } from '@bitr/chronodb';
import { createOrder } from './helper';
import { OrderSide, CashMarginType, OrderType, HistoricalOrderStore } from '../types';

describe('HistoricalOrderStore', () => {
  let store: HistoricalOrderStore;
  let chronoDB;
  beforeAll(async () => {
    chronoDB = new ChronoDB(`${__dirname}/datastore/histtest`);
    store = getHistoricalOrderStore(chronoDB);
    await store.delAll();
  });

  afterAll(async () => {
    await store.delAll();
    await chronoDB.close();
  });

  test('put/get', async () => {
    const order = createOrder('Dummy1', OrderSide.Buy, 0.001, 1000000, CashMarginType.Cash, OrderType.Limit, 1);
    const key = await store.put(order);
    const result = await store.get(key);
    expect(result.creationTime).toEqual(order.creationTime);
    expect(result.broker).toEqual(order.broker);
    expect(result.side).toEqual(order.side);
  });

  test('put twice, getAll, del', async () => {
    await store.delAll();
    const order1 = createOrder('Dummy1', OrderSide.Buy, 0.001, 1000000, CashMarginType.Cash, OrderType.Limit, 1);
    const order2 = createOrder('Dummy1', OrderSide.Buy, 0.001, 1000000, CashMarginType.Cash, OrderType.Limit, 1);
    const key1 = await store.put(order1);
    const key2 = await store.put(order2);
    const result = await store.getAll();
    expect(result.length).toBe(2);
    expect(result[1].value.creationTime).toEqual(order2.creationTime);
    expect(result[1].value.broker).toEqual(order2.broker);
    expect(result[1].value.side).toEqual(order2.side);
    await store.del(key1);
    const result2 = await store.getAll();
    expect(result2.length).toBe(1);
    expect(result2[0].key).toBe(key2);
  });
});
