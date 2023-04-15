import "reflect-metadata";
import { options } from "@bitr/logger";
import { expect, spy } from "chai";
import { DateTime } from "luxon";

import BrokerAdapterRouter from "../src/brokerAdapterRouter";
import QuoteAggregator from "../src/quoteAggregator";
import { QuoteSide } from "../src/types";
import { delay } from "../src/util";

options.enabled = false;

const config = {
  iterationInterval: 3000,
  priceMergeSize: 100,
  brokers: [
    {
      broker: "Bitflyer",
      enabled: true,
    },
    {
      broker: "Quoine",
      enabled: true,
      maxLongPosition: 0.3,
      maxShortPosition: 0.3,
    },
    {
      broker: "Coincheck",
      enabled: true,
      maxLongPosition: 1,
      maxShortPosition: 0,
    },
  ],
};
const configStore = { config };

describe("Quote Aggregator", () => {
  it("folding", async () => {
    configStore.config.iterationInterval = 10;
    const bitflyerBa = {
      broker: "Bitflyer",
      fetchQuotes: () =>
        Promise.resolve([
          { broker: "Bitflyer", side: QuoteSide.Ask, price: 500000, volume: 0.1 },
          { broker: "Bitflyer", side: QuoteSide.Ask, price: 500001, volume: 0.1 },
        ]),
    };
    const coincheckBa = {
      broker: "Coincheck",
      fetchQuotes: () =>
        Promise.resolve([
          { broker: "Coincheck", side: QuoteSide.Bid, price: 490001, volume: 0.02 },
          { broker: "Coincheck", side: QuoteSide.Bid, price: 490000, volume: 0.2 },
        ]),
    };
    const quoineBa = {
      broker: "Quoine",
      fetchQuotes: () => Promise.resolve([]),
    };
    const baList = [bitflyerBa, coincheckBa, quoineBa];
    const baRouter = new (BrokerAdapterRouter as any)(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore as any, baRouter);
    let mustBeCalledCount = 0;
    const mustBeCalled = spy(() => ++mustBeCalledCount);
    aggregator.on("quoteUpdated", async quotes => {
      try{
        expect(quotes.length).to.equal(3);
        expect(quotes[0].broker).to.equal("Bitflyer");
        expect(quotes[0].side).to.equal("Ask");
        expect(quotes[0].price).to.equal(500000);
        expect(quotes[0].volume).to.equal(0.1);
        mustBeCalled();
      } catch(ex){
        console.log(ex);
        expect(ex.message).to.equal("");
      }
    });
    await aggregator.start();
    await delay(0);
    await aggregator.stop();
    expect(mustBeCalledCount).to.be.greaterThanOrEqual(1);
  });

  it("folding with noTradePeriods", async () => {
    configStore.config.iterationInterval = 10;
    const current = DateTime.local();
    const start = current.minus({ minutes: 5 });
    const end = current.plus({ minutes: 5 });
    // @ts-expect-error
    configStore.config.brokers[0].noTradePeriods = [
      [start.toLocaleString(DateTime.TIME_24_SIMPLE), end.toLocaleString(DateTime.TIME_24_SIMPLE)],
    ];
    const bitflyerBa = {
      broker: "Bitflyer",
      fetchQuotes: () =>
        Promise.resolve([
          { broker: "Bitflyer", side: QuoteSide.Ask, price: 500000, volume: 0.1 },
          { broker: "Bitflyer", side: QuoteSide.Ask, price: 500001, volume: 0.1 },
        ]),
    };
    const coincheckBa = {
      broker: "Coincheck",
      fetchQuotes: () =>
        Promise.resolve([
          { broker: "Coincheck", side: QuoteSide.Bid, price: 490001, volume: 0.02 },
          { broker: "Coincheck", side: QuoteSide.Bid, price: 490000, volume: 0.2 },
        ]),
    };
    const quoineBa = {
      broker: "Quoine",
      fetchQuotes: () => Promise.resolve([]),
    };
    const baList = [bitflyerBa, coincheckBa, quoineBa];
    const baRouter = new (BrokerAdapterRouter as any)(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore as any, baRouter);
    let mustBeCalledCount = 0;
    const mustBeCalled = spy(() => ++mustBeCalledCount);
    aggregator.on("quoteUpdated", async quotes => {
      expect(quotes.length).to.equal(1);
      mustBeCalled();
    });
    await aggregator.start();
    await delay(0);
    await aggregator.stop();
    expect(mustBeCalledCount).to.be.greaterThanOrEqual(1);
  });

  it("folding with noTradePeriods -> no matching period", async () => {
    configStore.config.iterationInterval = 10;
    const current = DateTime.local();
    const start = current.plus({ minutes: 5 });
    const end = current.plus({ minutes: 15 });
    // @ts-expect-error
    configStore.config.brokers[0].noTradePeriods = [
      [start.toLocaleString(DateTime.TIME_24_SIMPLE), end.toLocaleString(DateTime.TIME_24_SIMPLE)],
    ];
    const bitflyerBa = {
      broker: "Bitflyer",
      fetchQuotes: () =>
        Promise.resolve([
          { broker: "Bitflyer", side: QuoteSide.Ask, price: 500000, volume: 0.1 },
          { broker: "Bitflyer", side: QuoteSide.Ask, price: 500001, volume: 0.1 },
        ]),
    };
    const coincheckBa = {
      broker: "Coincheck",
      fetchQuotes: () =>
        Promise.resolve([
          { broker: "Coincheck", side: QuoteSide.Bid, price: 490001, volume: 0.02 },
          { broker: "Coincheck", side: QuoteSide.Bid, price: 490000, volume: 0.2 },
        ]),
    };
    const quoineBa = {
      broker: "Quoine",
      fetchQuotes: () => Promise.resolve([]),
    };
    const baList = [bitflyerBa, coincheckBa, quoineBa];
    const baRouter = new (BrokerAdapterRouter as any)(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore as any, baRouter);
    let mustBeCalledCount = 0;
    const mustBeCalled = spy(() => ++mustBeCalledCount);
    aggregator.on("quoteUpdated", async quotes => {
      expect(quotes.length).to.equal(3);
      mustBeCalled();
    });
    await aggregator.start();
    await delay(0);
    await aggregator.stop();
    expect(mustBeCalledCount).to.be.greaterThanOrEqual(1);
  });

  it("folding with noTradePeriods -> invalid period", async () => {
    configStore.config.iterationInterval = 10;
    // @ts-expect-error
    configStore.config.brokers[0].noTradePeriods = [["00_00", "01_00"]];
    const bitflyerBa = {
      broker: "Bitflyer",
      fetchQuotes: () =>
        Promise.resolve([
          { broker: "Bitflyer", side: QuoteSide.Ask, price: 500000, volume: 0.1 },
          { broker: "Bitflyer", side: QuoteSide.Ask, price: 500001, volume: 0.1 },
        ]),
    };
    const coincheckBa = {
      broker: "Coincheck",
      fetchQuotes: () =>
        Promise.resolve([
          { broker: "Coincheck", side: QuoteSide.Bid, price: 490001, volume: 0.02 },
          { broker: "Coincheck", side: QuoteSide.Bid, price: 490000, volume: 0.2 },
        ]),
    };
    const quoineBa = {
      broker: "Quoine",
      fetchQuotes: () => Promise.resolve([]),
    };
    const baList = [bitflyerBa, coincheckBa, quoineBa];
    const baRouter = new (BrokerAdapterRouter as any)(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore as any, baRouter);
    let mustBeCalledCount = 0;
    const mustBeCalled = spy(() => ++mustBeCalledCount);
    aggregator.on("quoteUpdated", async quotes => {
      expect(quotes.length).to.equal(3);
      mustBeCalled();
    });
    await aggregator.start();
    await delay(0);
    await aggregator.stop();
    expect(mustBeCalledCount).to.be.greaterThanOrEqual(1);
  });

  it("folding when a broker is disabled", async () => {
    configStore.config.iterationInterval = 11;
    config.brokers[0].enabled = false;
    const bitflyerBa = {
      broker: "Bitflyer",
      fetchQuotes: () =>
        Promise.resolve([
          { broker: "Bitflyer", side: QuoteSide.Ask, price: 500000, volume: 0.1 },
          { broker: "Bitflyer", side: QuoteSide.Ask, price: 500001, volume: 0.01 },
        ]),
    };
    const coincheckBa = {
      broker: "Coincheck",
      fetchQuotes: () =>
        Promise.resolve([
          { broker: "Coincheck", side: QuoteSide.Bid, price: 490001, volume: 0.02 },
          { broker: "Coincheck", side: QuoteSide.Bid, price: 490000, volume: 0.2 },
        ]),
    };
    const quoineBa = {
      broker: "Quoine",
      fetchQuotes: () => Promise.resolve([]),
    };
    const baList = [bitflyerBa, coincheckBa, quoineBa];
    const baRouter = new (BrokerAdapterRouter as any)(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore as any, baRouter);
    let mustBeCalledCount = 0;
    const mustBeCalled = spy(() => ++mustBeCalledCount);
    aggregator.on("quoteUpdated", async quotes => {
      expect(quotes.length).to.equal(1);
      mustBeCalled();
    });
    await aggregator.start();
    await delay(0);
    await aggregator.stop();
    expect(mustBeCalledCount).to.be.greaterThanOrEqual(1);
  });

  it("onQuoteUpdated", async () => {
    configStore.config.iterationInterval = 12;
    const bitflyerBa = {
      broker: "Bitflyer",
      fetchQuotes: () =>
        Promise.resolve([
          { broker: "Bitflyer", side: QuoteSide.Ask, price: 500000, volume: 0.1 },
          { broker: "Bitflyer", side: QuoteSide.Ask, price: 500001, volume: 0.01 },
        ]),
    };
    const quoineBa = {
      broker: "Quoine",
      fetchQuotes: () => Promise.resolve([]),
    };
    const coincheckBa = {
      broker: "Coincheck",
      fetchQuotes: () => Promise.resolve([]),
    };
    const baList = [bitflyerBa, quoineBa, coincheckBa];
    const baRouter = new (BrokerAdapterRouter as any)(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore as any, baRouter);
    let fnCalledCount = 0;
    const fn = spy(async () => void ++fnCalledCount);
    aggregator.on("quoteUpdated", fn);
    await aggregator.start();
    await delay(0);
    expect(fnCalledCount).to.be.greaterThan(0);
    await aggregator.stop();
  });

  it("onQuoteUpdated without event handler", async () => {
    configStore.config.iterationInterval = 12;
    const bitflyerBa = {
      broker: "Bitflyer",
      fetchQuotes: () =>
        Promise.resolve([
          { broker: "Bitflyer", side: QuoteSide.Ask, price: 500000, volume: 0.1 },
          { broker: "Bitflyer", side: QuoteSide.Ask, price: 500001, volume: 0.01 },
        ]),
    };
    const quoineBa = {
      broker: "Quoine",
      fetchQuotes: () => Promise.resolve([]),
    };
    const coincheckBa = {
      broker: "Coincheck",
      fetchQuotes: () => Promise.resolve([]),
    };
    const baList = [bitflyerBa, quoineBa, coincheckBa];
    const baRouter = new (BrokerAdapterRouter as any)(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore as any, baRouter);
    await aggregator.start();
    await delay(0);
    await aggregator.stop();
  });

  it("when already running", async () => {
    configStore.config.iterationInterval = 12;
    const bitflyerBa = {
      broker: "Bitflyer",
      fetchQuotes: () => Promise.resolve([]),
    };
    const quoineBa = {
      broker: "Quoine",
      fetchQuotes: spy(),
    };
    const coincheckBa = {
      broker: "Coincheck",
      fetchQuotes: () => Promise.resolve([]),
    };
    const baList = [bitflyerBa, quoineBa, coincheckBa];
    const baRouter = new (BrokerAdapterRouter as any)(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore as any, baRouter);
    aggregator["isRunning"] = true;
    await aggregator.start();
    await aggregator.stop();
    expect(quoineBa.fetchQuotes).not.to.be.called();
  });

  it("fetchQuotes throws", async () => {
    configStore.config.iterationInterval = 12;
    const bitflyerBa = {
      broker: "Bitflyer",
      fetchQuotes: () => Promise.resolve([]),
    };
    const quoineBa = {
      broker: "Quoine",
      fetchQuotes: async () => {
        throw new Error("Mock fetchQuotes failed.");
      },
    };
    const coincheckBa = {
      broker: "Coincheck",
      fetchQuotes: () => Promise.resolve([]),
    };
    const baList = [bitflyerBa, quoineBa, coincheckBa];
    const baRouter = new (BrokerAdapterRouter as any)(baList);
    const aggregator: QuoteAggregator = new QuoteAggregator(configStore as any, baRouter);
    await aggregator.start();
    await aggregator.stop();
    expect(aggregator["quotes"].length).to.equal(0);
  });
});

it("stop without start", () => {
  const aggregator = new QuoteAggregator(configStore as any, [] as any);
  aggregator.stop();
});
