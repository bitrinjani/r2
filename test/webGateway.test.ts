import { EventEmitter } from "events";

import { spy } from "chai";
import WebSocket from "ws";

import { delay } from "../src/util";
import WebGateway from "../src/webGateway";

describe("WebGateway", () => {
  let quoteAggregator: any, positionService: any, opportunitySearcher: any, activePairStore: any, orderService: any;

  beforeEach(() => {
    quoteAggregator = new EventEmitter();
    positionService = new EventEmitter();
    opportunitySearcher = new EventEmitter();
    activePairStore = new EventEmitter();
    activePairStore.get = spy(() => []);
    orderService = new EventEmitter();
  });

  it("start, stop - not enabled", async () => {
    const config = { webGateway: { enabled: false } };
    const configStore = new EventEmitter() as any;
    configStore.config = config;
    const wg = new WebGateway(
      quoteAggregator,
      configStore,
      positionService,
      opportunitySearcher,
      activePairStore,
      // @ts-expect-error
      orderService
    );
    await wg.start();
    await delay(0);
    await wg.stop();
    await delay(10);
  });

  it("start, stop - enabled", async () => {
    const config = { webGateway: { enabled: true }, brokers: [{ key: "key", secret: "secret" }] };
    const configStore = new EventEmitter() as any;
    configStore.config = config;
    const wg = new WebGateway(
      quoteAggregator,
      configStore,
      positionService,
      opportunitySearcher,
      activePairStore,
      // @ts-expect-error
      orderService
    );
    try{
      await wg.start();
      await delay(100);
    } finally{
      await wg.stop();
      await delay(100);
    }
  });

  it("emit events", async () => {
    const config = { webGateway: { enabled: true }, brokers: [{ key: "key", secret: "secret" }] };
    const configStore = new EventEmitter() as any;
    configStore.config = config;
    const wg = new WebGateway(
      quoteAggregator,
      configStore,
      positionService,
      opportunitySearcher,
      activePairStore,
      // @ts-expect-error
      orderService
    );
    let ws: any;
    try{
      await wg.start();
      await delay(10);
      ws = new WebSocket("ws://localhost:8720");
      await delay(10);
      quoteAggregator.emit("quoteUpdated");
      positionService.emit("positionUpdated");
      opportunitySearcher.emit("spreadAnalysisDone");
      opportunitySearcher.emit("limitCheckDone");
      activePairStore.emit("change");
      orderService.emit("orderCreated");
      orderService.emit("orderUpdated");
      orderService.emit("orderFinalized");
      configStore.emit("configUpdated", config);
      await delay(100);
    } finally{
      ws.close();
      await delay(100);
      await wg.stop();
      await delay(100);
    }
  });

  it("emit events - no ws client", async () => {
    const config = { webGateway: { enabled: true }, brokers: [{ key: "key", secret: "secret" }] };
    const configStore = new EventEmitter() as any;
    configStore.config = config;
    const wg = new WebGateway(
      quoteAggregator,
      configStore,
      positionService,
      opportunitySearcher,
      activePairStore,
      // @ts-expect-error
      orderService
    );
    try{
      await wg.start();
      await delay(100);
      quoteAggregator.emit("quoteUpdated");
      await delay(100);
    } finally{
      await wg.stop();
      await delay(100);
    }
  });
});
