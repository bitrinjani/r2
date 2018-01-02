import Order from '../Order';
import { OrderStatus, OrderPair, OrderSide, CashMarginType, OrderType, Broker } from '../types';
import { getActivePairStore } from '../ActivePairLevelStore';
import { ChronoDB } from '@bitr/chronodb';

describe('ActivePairLevelStore', () => {
  let store;
  let chronoDB;
  beforeAll(async () => {
    chronoDB = new ChronoDB(`${__dirname}/datastore/1`);
    store = getActivePairStore(chronoDB);
    await store.delAll();
  });

  afterAll(async () => {
    await store.delAll();
    await chronoDB.close();
  });

  test('put, get, getAll', async () => {
    const buyLeg = new Order('Dummy1' as Broker, OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
    buyLeg.filledSize = 0.1;
    buyLeg.status = OrderStatus.Filled;
    const sellLeg = new Order('Dummy2' as Broker, OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
    sellLeg.filledSize = 0.1;
    sellLeg.status = OrderStatus.Filled;
    const pair: OrderPair = [buyLeg, sellLeg];
    const key = await store.put(pair);
    const result = await store.get(key);
    expect(result.length).toBe(2);
    expect(() => result[0].toShortString()).not.toThrow();
    const activePairKeyValues = await store.getAll();
    expect(activePairKeyValues[activePairKeyValues.length - 1].value[1].broker).toBe('Dummy2');
  });

  test('del', async () => {
    const buyLeg = new Order('Dummy1' as Broker, OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
    buyLeg.filledSize = 0.1;
    buyLeg.status = OrderStatus.Filled;
    const sellLeg = new Order('Dummy2' as Broker, OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
    sellLeg.filledSize = 0.1;
    sellLeg.status = OrderStatus.Filled;
    const pair: OrderPair = [buyLeg, sellLeg];
    const key = await store.put(pair);
    const result = await store.get(key);
    expect(result.length).toBe(2);
    expect(() => result[0].toShortString()).not.toThrow();
    await store.del(key);
    try {
      const result2 = await store.get(key);
    } catch (ex) {
      expect(ex.message).toContain('Key not found');
      return;
    }
    throw Error();
  });

  test('delAll', async () => {
    await store.delAll();
    const activePairs = await store.getAll();
    expect(activePairs.length).toBe(0);
  });
});
