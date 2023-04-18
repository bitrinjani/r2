import "reflect-metadata";
import { options } from "@bitr/logger";
import { expect, spy } from "chai";

import { createOrder } from "./helper";
import BrokerAdapterRouter from "../src/brokerAdapterRouter";
import BrokerStabilityTracker from "../src/brokerStabilityTracker";
options.enabled = false;

const baBitflyer = {
  broker: "Bitflyer",
  send: spy(),
  cancel: spy(),
  fetchQuotes: spy(),
  getBtcPosition: spy(),
  refresh: spy(),
};

const baQuoine = {
  broker: "Quoine",
  send: spy(),
  cancel: spy(),
  fetchQuotes: spy(),
  getBtcPosition: spy(),
  refresh: spy(),
};

const brokerAdapters = [baBitflyer, baQuoine];

const config = {
  symbol: "BTC/JPY",
  stabilityTracker: {
    threshold: 8,
    recoveryInterval: 1000,
  },
  brokers: [{ broker: "dummy1" }, { broker: "dummy2" }],
};

const orderService = {
  emitOrderUpdated: spy(),
};

const bst = new BrokerStabilityTracker({ config } as any);
const baRouter = new BrokerAdapterRouter(brokerAdapters as any, bst, { config } as any, orderService as any);

describe("BrokerAdapterRouter", () => {
  it("send", async () => {
    const order = createOrder("Bitflyer", "Buy", 0.001, 500000, "Cash", "Limit", 0);
    await baRouter.send(order);
    expect(baBitflyer.send).to.be.called.exactly(1);
    expect(baQuoine.send).to.be.called.exactly(0);
  });

  it("fetchQuotes", async () => {
    await baRouter.fetchQuotes("Bitflyer");
    expect(baBitflyer.fetchQuotes).to.be.called.exactly(1);
    expect(baQuoine.fetchQuotes).to.be.called.exactly(0);
  });

  it("cancel", async () => {
    const order = createOrder("Bitflyer", "Buy", 0.001, 500000, "Cash", "Limit", 0);
    await baRouter.cancel(order);
    expect(baBitflyer.cancel).to.be.called.exactly(1);
    expect(baQuoine.cancel).to.be.called.exactly(0);
  });

  it("getBtcPosition", async () => {
    await baRouter.getPositions("Quoine");
    expect(baBitflyer.getBtcPosition).to.be.called.exactly(0);
    expect(baQuoine.getBtcPosition).to.be.called.exactly(1);
  });

  it("refresh", async () => {
    const order = createOrder("Quoine", "Buy", 0.001, 500000, "Cash", "Limit", 0);
    await baRouter.refresh(order);
    expect(baBitflyer.refresh).to.be.called.exactly(0);
    expect(baQuoine.refresh).to.be.called.exactly(1);
  });

  it("send throws", async () => {
    const baBitflyer = {
      broker: "Bitflyer",
      send: () => {
        throw new Error("dummy");
      },
      cancel: spy(),
      fetchQuotes: () => {
        throw new Error("dummy");
      },
      getBtcPosition: () => {
        throw new Error("dummy");
      },
      refresh: spy(),
    };

    const brokerAdapters = [baBitflyer];
    const baRouter = new BrokerAdapterRouter(brokerAdapters as any, bst, { config } as any, orderService as any);
    try{
      await baRouter.send({ broker: "Bitflyer" } as any);
    } catch(ex){
      expect(ex.message).to.equal("dummy");
      return;
    }
    expect(true).to.equal(false);
  });

  it("fetchQuotes throws", async () => {
    const baBitflyer = {
      broker: "Bitflyer",
      send: () => {
        throw new Error("dummy");
      },
      cancel: spy(),
      fetchQuotes: () => {
        throw new Error("dummy");
      },
      getBtcPosition: () => {
        throw new Error("dummy");
      },
      refresh: spy(),
    };

    const brokerAdapters = [baBitflyer];
    const baRouter = new BrokerAdapterRouter(brokerAdapters as any, bst, { config } as any, orderService as any);

    const quotes = await baRouter.fetchQuotes("Bitflyer");
    expect(quotes).to.equal([]);
  });

  it("getBtcPosition throws", async () => {
    const baBitflyer = {
      broker: "Bitflyer",
      send: () => {
        throw new Error("dummy");
      },
      cancel: spy(),
      fetchQuotes: () => {
        throw new Error("dummy");
      },
      getBtcPosition: () => {
        throw new Error("dummy");
      },
      refresh: spy(),
    };

    const brokerAdapters = [baBitflyer];
    const baRouter = new BrokerAdapterRouter(brokerAdapters as any, bst, { config } as any, orderService as any);
    try{
      await baRouter.getPositions("Bitflyer");
    } catch(ex){
      expect(ex.message).to.equal("dummy");
      return;
    }
    expect(true).to.equal(false);
  });

  it("getBtcPosition/getPositions not found", async () => {
    const baBitflyer = {
      broker: "Bitflyer",
    };

    const brokerAdapters = [baBitflyer];
    const conf = Object.assign({}, config, { symbol: "XXX/YYY" });
    const baRouter = new BrokerAdapterRouter(brokerAdapters as any, bst, { config: conf } as any, orderService as any);
    try{
      await baRouter.getPositions("Bitflyer");
    } catch(ex){
      expect(ex.message).to.equal("Unable to find a method to get positions.");
      return;
    }
    expect(true).to.equal(false);
  });

  it("getPositions for non BTC/JPY symbol", async () => {
    const baBitflyer = {
      broker: "Bitflyer",
      getPositions: spy(),
    };

    const brokerAdapters = [baBitflyer];
    const conf = Object.assign({}, config, { symbol: "XXX/YYY" });
    const baRouter = new BrokerAdapterRouter(brokerAdapters as any, bst, { config: conf } as any, orderService as any);
    await baRouter.getPositions("Bitflyer");
    expect(baBitflyer.getPositions).to.be.called();
  });
});
