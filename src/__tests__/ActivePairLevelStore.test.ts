import Order from '../Order';
import { OrderStatus, OrderPair, OrderSide, CashMarginType, OrderType, Broker } from '../types';
import ActivePairLevelStore from '../ActivePairLevelStore';

describe('ActivePairLevelStore', () => {
  let store;
  beforeAll(async () => {
    store = new ActivePairLevelStore(`${__dirname}/datastore/1`);
    await store.delAll();
  });

  afterAll(async () => {
    await store.delAll();
  });

  test('put, get, getAll', async () => {
    const buyLeg = new Order('Dummy1' as Broker, OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
    buyLeg.filledSize = 0.1;
    buyLeg.status = OrderStatus.Filled;
    const sellLeg = new Order('Dummy2' as Broker, OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
    sellLeg.filledSize = 0.1;
    sellLeg.status = OrderStatus.Filled;
    const pair: OrderPair = [buyLeg, sellLeg];
    const key = store.generateKey();
    await store.put(key, pair);
    const result = await store.get(key);
    expect(result.length).toBe(2);
    expect(() => result[0].toShortString()).not.toThrow();
    const activePairKeyValues = await store.getAll();
    expect(activePairKeyValues[activePairKeyValues.length - 1].value[1].broker).toBe('Dummy2');
  });

  test('put invalid pair, get', async () => {
    const buyLeg = new Order('Dummy1' as Broker, OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
    buyLeg.filledSize = 0.1;
    buyLeg.status = OrderStatus.Filled;
    const sellLeg = new Order(
      'Dummy2' as Broker,
      OrderSide.Sell,
      0.10015,
      110,
      CashMarginType.Cash,
      OrderType.Limit,
      10
    );
    sellLeg.filledSize = 0.1;
    sellLeg.status = OrderStatus.Filled;
    const pair: OrderPair = [buyLeg, sellLeg];
    const key = store.generateKey();
    await store.put(key, pair);
    try {
      const result = await store.get(key);
    } catch (ex) {
      expect(ex.message).toContain('Key not found');
      return;
    }
    throw Error();
  });

  test('del', async () => {
    const buyLeg = new Order('Dummy1' as Broker, OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
    buyLeg.filledSize = 0.1;
    buyLeg.status = OrderStatus.Filled;
    const sellLeg = new Order('Dummy2' as Broker, OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
    sellLeg.filledSize = 0.1;
    sellLeg.status = OrderStatus.Filled;
    const pair: OrderPair = [buyLeg, sellLeg];
    const key = store.generateKey();
    await store.put(key, pair);
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
