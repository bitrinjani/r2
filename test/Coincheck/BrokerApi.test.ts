// tslint:disable:object-literal-key-quotes
// tslint:disable:max-line-length
import { options } from "@bitr/logger";
import { expect } from "chai";
import * as _ from "lodash";
import * as nock from "nock";

import nocksetup from "./nocksetup";
import BrokerApi from "../../src/Coincheck/BrokerApi";

options.enabled = false;

nocksetup();

describe("BrokerApi", function(){
  it("getAccountsBalance", async () => {
    const api = new BrokerApi("", "");
    const reply = await api.getAccountsBalance();
    expect(reply.btc).to.equal(0.123);
    expect(reply.jpy).to.equal(0.375);
  });

  it("getLeverageBalance", async () => {
    const api = new BrokerApi("", "");
    const reply = await api.getLeverageBalance();
    expect(reply.margin.jpy).to.be.closeTo(131767.22675655, 0.0001);
    expect(reply.margin_available.jpy).to.be.closeTo(116995.98446494, 0.0001);
    expect(reply.margin_level).to.be.closeTo(8.36743, 0.0001);
  });

  it("getLeveragePositions", async () => {
    const api = new BrokerApi("", "");
    const pos = await api.getLeveragePositions({ status: "open" });
    expect(pos.success).to.equal(true);
    expect(pos.pagination.limit).to.equal(10);
    expect(pos.data.length).to.equal(9);
    expect(pos.data[1].new_order.created_at.toISOString()).to.equal("2017-10-20T22:41:59.000Z");
  });

  it("getLeveragePositions paging", async () => {
    const api = new BrokerApi("", "");
    const pos1 = await api.getLeveragePositions({ status: "open", limit: 4, order: "desc" });
    const pos2 = await api.getLeveragePositions({ status: "open", limit: 4, order: "desc", starting_after: _.last(pos1.data)?.id });
    const pos3 = await api.getLeveragePositions({ status: "open", limit: 4, order: "desc", starting_after: _.last(pos2.data)?.id });
    const positions = _.concat(pos1.data, pos2.data, pos3.data);
    expect(positions.length).to.equal(9);
    expect(positions[1].new_order.created_at.toISOString()).to.equal("2017-10-20T22:41:59.000Z");
  });

  it("getAllOpenLeveragePositions", async () => {
    const api = new BrokerApi("", "");
    const positions = await api.getAllOpenLeveragePositions(4);
    expect(positions.length).to.equal(9);
    expect(positions[1].new_order.created_at.toISOString()).to.equal("2017-10-20T22:41:59.000Z");
  });

  it("getAllOpenLeveragePositions cache", async () => {
    const api = new BrokerApi("", "");
    let positions = await api.getAllOpenLeveragePositions(4);
    expect(positions.length).to.equal(9);
    expect(positions[1].new_order.created_at.toISOString()).to.equal("2017-10-20T22:41:59.000Z");
    positions = await api.getAllOpenLeveragePositions(4);
    expect(positions.length).to.equal(9);
    expect(positions[1].new_order.created_at.toISOString()).to.equal("2017-10-20T22:41:59.000Z");
  });

  it("getOrderBooks", async () => {
    const api = new BrokerApi("", "");
    const orderBooks = await api.getOrderBooks();
    expect(orderBooks.asks.length).to.equal(200);
    for(const pair of orderBooks.asks){
      expect(_.isNumber(pair[0])).to.equal(true);
      expect(_.isNumber(pair[1])).to.equal(true);
      expect(pair[0] > 100000).to.equal(true);
      expect(pair[1] < 100000).to.equal(true);
    }
  });

  it("newOrder", async () => {
    const api = new BrokerApi("", "");
    const request = { pair: "btc_jpy", order_type: "leverage_buy", amount: "0.005", rate: "300000" };
    const reply = await api.newOrder(request as any);
    expect(reply.amount).to.equal(0.005);
    expect(reply.rate).to.equal(300000);
  });

  it("cancelOrder", async () => {
    const api = new BrokerApi("", "");
    const id = "340809935";
    const reply = await api.cancelOrder(id);
    expect(_.isString(reply.id)).to.equal(true);
    expect(reply.id).to.equal(id);
  });

  it("getOpenOrders", async () => {
    const api = new BrokerApi("", "");
    const openOrders = await api.getOpenOrders();
    expect(openOrders.orders.length).to.equal(1);
    expect(openOrders.orders[0].id).to.equal("347772269");
  });

  it("getTransactions", async () => {
    const api = new BrokerApi("", "");
    const reply = await api.getTransactions({ limit: 20, order: "desc" });
    expect(reply.data.length === 20).to.equal(true);
    expect(reply.pagination.limit).to.equal(20);
    expect(typeof reply.data[0].id).to.equal("string");
    expect(reply.data[0].created_at.getFullYear()).to.equal(2017);
    expect(typeof reply.data[0].rate).to.equal("number");
    expect(_.every(reply.data, d => _.inRange(d.rate, 500000, 700000))).to.equal(true);
    expect(_.every(reply.data.filter(d => d.side === "buy"), d => _.inRange(d.funds.btc, 0.001, 1))).to.equal(true);
    expect(_.every(reply.data.filter(d => d.side === "sell"), d => _.inRange(d.funds.btc, -1, -0.001))).to.equal(true);
  });

  this.afterAll(() => {
    nock.restore();
  });
});
