import type { HistoricalOrderStore } from "../src/types";

import { expect } from "chai";

import { createOrder } from "./helper";
import { ChronoDB } from "../src/chrono";
import { getHistoricalOrderStore } from "../src/historicalOrderStore";
import { OrderSide, CashMarginType, OrderType } from "../src/types";


describe("HistoricalOrderStore", function(){
  let store: HistoricalOrderStore;
  let chronoDB;
   
  this.beforeAll(async () => {
    chronoDB = new ChronoDB(`${__dirname}/datastore/histtest`);
    store = getHistoricalOrderStore(chronoDB);
    await store.delAll();
  });

   
  this.afterAll(async () => {
    await store.delAll();
    await chronoDB.close();
  });

  it("put/get", async () => {
    const order = createOrder("Dummy1", OrderSide.Buy, 0.001, 1000000, CashMarginType.Cash, OrderType.Limit, 1);
    const key = await store.put(order);
    const result = await store.get(key);
    expect(result.creationTime).to.equal(order.creationTime);
    expect(result.broker).to.equal(order.broker);
    expect(result.side).to.equal(order.side);
  });

  it("put twice, getAll, del", async () => {
    await store.delAll();
    const order1 = createOrder("Dummy1", OrderSide.Buy, 0.001, 1000000, CashMarginType.Cash, OrderType.Limit, 1);
    const order2 = createOrder("Dummy1", OrderSide.Buy, 0.001, 1000000, CashMarginType.Cash, OrderType.Limit, 1);
    const key1 = await store.put(order1);
    const key2 = await store.put(order2);
    const result = await store.getAll();
    expect(result.length).to.equal(2);
    expect(result[1].value.creationTime).to.equal(order2.creationTime);
    expect(result[1].value.broker).to.equal(order2.broker);
    expect(result[1].value.side).to.equal(order2.side);
    await store.del(key1);
    const result2 = await store.getAll();
    expect(result2.length).to.equal(1);
    expect(result2[0].key).to.equal(key2);
  });
});
