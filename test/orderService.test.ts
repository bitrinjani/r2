import { expect, spy } from "chai";

import OrderService from "../src/orderService";
import { delay } from "../src/util";

describe("OrderService", () => {
  const store = { put: spy() };

  it("create, emitOrderUpdated, finalize", async () => {
    const os = new OrderService(store as any);
    const orderCreated = spy((d: any) => {}); // noop
    const orderUpdatedArgs = [] as any[][];
    const orderUpdated = spy((...args) => orderUpdatedArgs.push(args));
    const orderFinalized = spy();
    os.on("orderCreated", o => {
      orderCreated(o);
      console.log(o);
    });
    os.on("orderUpdated", orderUpdated);
    os.on("orderFinalized", orderFinalized);
    const order = os.createOrder({
      symbol: "BTC/JPY",
      broker: "Dummy",
      side: "Buy",
      size: 0.001,
      price: 1000000,
      cashMarginType: "Cash",
      type: "Limit",
      leverageLevel: 1,
    });
    await delay(0);
    expect(order.status).to.equal("PendingNew");
    expect(orderCreated).to.be.called();

    order.status = "Filled";
    os.emitOrderUpdated(order);
    await delay(0);
    expect(orderUpdatedArgs[0][0].status).to.equal("Filled");

    os.finalizeOrder(order);
    await delay(0);
    expect(orderFinalized).to.be.called();
  });
});
