import type { Broker, OrderPair } from "../src/types";

import { expect } from "chai";

import { createOrder } from "./helper";
import { getActivePairStore } from "../src/activePairLevelStore";
import { ChronoDB } from "../src/chrono";
import * as OrderUtil from "../src/orderUtil";
import { OrderStatus, OrderSide, CashMarginType, OrderType } from "../src/types";


describe("ActivePairLevelStore", function(){
  let store;
  let chronoDB;
  this.beforeAll(async () => {
    chronoDB = new ChronoDB(`${__dirname}/datastore/1`);
    store = getActivePairStore(chronoDB);
    await store.delAll();
  });

  this.afterAll(async () => {
    await store.delAll();
    await chronoDB.close();
  });

  it("put, get, getAll", async () => {
    const buyLeg = createOrder("Dummy1" as Broker, OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
    buyLeg.filledSize = 0.1;
    buyLeg.status = OrderStatus.Filled;
    const sellLeg = createOrder("Dummy2" as Broker, OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
    sellLeg.filledSize = 0.1;
    sellLeg.status = OrderStatus.Filled;
    const pair: OrderPair = [buyLeg, sellLeg];
    const key = await store.put(pair);
    const result = await store.get(key);
    expect(result.length).to.equal(2);
    expect(() => OrderUtil.toShortString(result[0])).not.to.throw();
    const activePairKeyValues = await store.getAll();
    expect(activePairKeyValues[activePairKeyValues.length - 1].value[1].broker).to.equal("Dummy2");
  });

  it("del", async () => {
    const buyLeg = createOrder("Dummy1" as Broker, OrderSide.Buy, 0.1, 100, CashMarginType.Cash, OrderType.Limit, 10);
    buyLeg.filledSize = 0.1;
    buyLeg.status = OrderStatus.Filled;
    const sellLeg = createOrder("Dummy2" as Broker, OrderSide.Sell, 0.1, 110, CashMarginType.Cash, OrderType.Limit, 10);
    sellLeg.filledSize = 0.1;
    sellLeg.status = OrderStatus.Filled;
    const pair: OrderPair = [buyLeg, sellLeg];
    const key = await store.put(pair);
    const result = await store.get(key);
    expect(result.length).to.equal(2);
    expect(() => OrderUtil.toShortString(result[0])).not.to.throw();
    await store.del(key);
    try{
      await store.get(key);
    } catch(ex){
      expect(ex.message).to.contain("Key not found");
      return;
    }
    throw Error();
  });

  it("delAll", async () => {
    await store.delAll();
    const activePairs = await store.getAll();
    expect(activePairs.length).to.equal(0);
  });
});
