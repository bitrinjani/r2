import type QuoteAggregator from "../src/quoteAggregator";

import { AwaitableEventEmitter } from "@bitr/awaitable-event-emitter";
import { expect, spy } from "chai";
import mkdirp from "mkdirp";
import rimraf from "rimraf";

import { reportServiceRepUrl } from "../src/constants";
import { SnapshotRequester } from "../src/messages";
import ReportService from "../src/reportService";
import SpreadAnalyzer from "../src/spreadAnalyzer";
import { toQuote } from "../src/util";


function createQuoteAggregatorMock() {
  const aee: QuoteAggregator = new AwaitableEventEmitter() as QuoteAggregator;
  aee.start = spy(() => Promise.resolve());
  aee.stop = spy(() => Promise.resolve());
  return aee;
}

describe("ReportService", () =>{
  it("start/stop", async () => {
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = { getSpreadStat: spy() };
    const timeSeries = { put: spy() };
    const config = {};

    const rs = new ReportService(quoteAggregator, spreadAnalyzer as any, timeSeries as any, { config } as any);
    rimraf.sync(rs["reportDir"]);
    await rs.start();
    expect(quoteAggregator.listenerCount("quoteUpdated")).to.equal(1);
    await rs.stop();
    expect(quoteAggregator.listenerCount("quoteUpdated")).to.equal(0);
  });

  it("start/stop with existing dir", async () => {
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = { getSpreadStat: spy() };
    const timeSeries = { put: spy() };
    const config = {};

    const rs = new ReportService(quoteAggregator, spreadAnalyzer as any, timeSeries as any, { config } as any);
    mkdirp.mkdirpManualSync(rs["reportDir"]);
    await rs.start();
    expect(quoteAggregator.listenerCount("quoteUpdated")).to.equal(1);
    await rs.stop();
    expect(quoteAggregator.listenerCount("quoteUpdated")).to.equal(0);
  });

  it("fire event", async () => {
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = { getSpreadStat: spy() };
    const timeSeries = { put: spy() };
    const config = {};

    const rs = new ReportService(quoteAggregator, spreadAnalyzer as any, timeSeries as any, { config } as any);
    mkdirp.mkdirpManualSync(rs["reportDir"]);
    await rs.start();
    expect(quoteAggregator.listenerCount("quoteUpdated")).to.equal(1);
    await quoteAggregator.emitParallel("quoteUpdated", []);
    await rs.stop();
    expect(quoteAggregator.listenerCount("quoteUpdated")).to.equal(0);
  });

  it("fire event 2", async () => {
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = new SpreadAnalyzer({
      config: {
        minSize: 0.005,
        maxSize: 100,
        brokers: [{ broker: "Coincheck", commissionPercent: 0 }, { broker: "Quoine", commissionPercent: 0 }],
      },
    } as any);
    const timeSeries = { put: spy() };
    const config = {};

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries as any, { config } as any);
    mkdirp.mkdirpManualSync(rs["reportDir"]);
    await rs.start();
    expect(quoteAggregator.listenerCount("quoteUpdated")).to.equal(1);
    await quoteAggregator.emitParallel("quoteUpdated", [
      toQuote("Coincheck", "Ask", 3, 1),
      toQuote("Coincheck", "Bid", 2, 2),
      toQuote("Quoine", "Ask", 3.5, 3),
      toQuote("Quoine", "Bid", 2.5, 4),
    ]);
    await rs.stop();
    expect(quoteAggregator.listenerCount("quoteUpdated")).to.equal(0);
  });

  it("start/stop with analytics", async () => {
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = { getSpreadStat: spy() };
    const timeSeries = { put: spy(), query: spy() };
    const config = {
      analytics: {
        enabled: true,
        plugin: "SimpleSpreadStatHandler.js",
        initialHistory: { minutes: 10 },
      },
    };

    const rs = new ReportService(quoteAggregator, spreadAnalyzer as any, timeSeries as any, { config } as any);
    rimraf.sync(rs["reportDir"]);
    try{
      await rs.start();
      expect(quoteAggregator.listenerCount("quoteUpdated")).to.equal(1);
      await rs.stop();
      expect(quoteAggregator.listenerCount("quoteUpdated")).to.equal(0);
    } catch(ex){
      if(process.env.CI && ex.message === "Address already in use") return;
      expect(true).to.equal(false);
    }
  });

  it("fire event with analytics", async () => {
    const config = {
      minSize: 0.005,
      maxSize: 100,
      analytics: {
        enabled: true,
        plugin: "SimpleSpreadStatHandler.js",
        initialHistory: { minutes: 10 },
      },
      brokers: [{ broker: "Coincheck", commissionPercent: 0 }, { broker: "Quoine", commissionPercent: 0 }],
    };
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = new SpreadAnalyzer({ config } as any);
    const timeSeries = { put: spy(), query: spy() };

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries as any, { config } as any);
    mkdirp.mkdirpManualSync(rs["reportDir"]);
    try{
      await rs.start();
      expect(quoteAggregator.listenerCount("quoteUpdated")).to.equal(1);
      await quoteAggregator.emitParallel("quoteUpdated", [
        toQuote("Coincheck", "Ask", 3, 1),
        toQuote("Coincheck", "Bid", 2, 2),
        toQuote("Quoine", "Ask", 3.5, 3),
        toQuote("Quoine", "Bid", 2.5, 4),
      ]);
      await rs.stop();
      expect(quoteAggregator.listenerCount("quoteUpdated")).to.equal(0);
    } catch(ex){
      if(process.env.CI && ex.message === "Address already in use") return;
      expect(true).to.equal(false);
    }
  });

  it("respond snapshot request", async () => {
    const config = {
      minSize: 0.005,
      maxSize: 100,
      analytics: {
        enabled: true,
        plugin: "SimpleSpreadStatHandler.js",
        initialHistory: { minutes: 10 },
      },
      brokers: [{ broker: "Coincheck", commissionPercent: 0 }, { broker: "Quoine", commissionPercent: 0 }],
    };
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = new SpreadAnalyzer({ config } as any);
    const timeSeries = { put: spy(), query: () => [{ value: "dummy" }] };

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries as any, { config } as any);
    mkdirp.mkdirpManualSync(rs["reportDir"]);
    let client;
    try{
      await rs.start();
      client = new SnapshotRequester(reportServiceRepUrl);
      const reply = await client.request({ type: "spreadStatSnapshot" });
      expect(reply.success).to.equal(true);
      expect(reply.data).to.equal(["dummy"]);
      await rs.stop();
    } catch(ex){
      if(process.env.CI && ex.message === "Address already in use") return;
      expect(true).to.equal(false);
    } finally{
      if(client) client.dispose();
    }
  });

  it("invalid request", async () => {
    const config = {
      minSize: 0.005,
      maxSize: 100,
      analytics: {
        enabled: true,
        plugin: "SimpleSpreadStatHandler.js",
        initialHistory: { minutes: 10 },
      },
      brokers: [{ broker: "Coincheck", commissionPercent: 0 }, { broker: "Quoine", commissionPercent: 0 }],
    };
    const quoteAggregator = createQuoteAggregatorMock();
    const spreadAnalyzer = new SpreadAnalyzer({ config } as any);
    const timeSeries = { put: spy(), query: () => [] as any };

    const rs = new ReportService(quoteAggregator, spreadAnalyzer, timeSeries as any, { config } as any);
    mkdirp.mkdirpManualSync(rs["reportDir"]);
    let client: any;
    try{
      await rs.start();
      client = new SnapshotRequester(reportServiceRepUrl);
      const reply = await client.request(client);
      expect(reply.success).to.equal(false);
      await rs.stop();
    } catch(ex){
      if(process.env.CI && ex.message === "Address already in use") return;
      expect(true).to.equal(false);
    } finally{
      if(client) client.dispose();
    }
  });
});
