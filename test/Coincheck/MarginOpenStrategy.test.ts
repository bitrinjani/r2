import { options } from "@bitr/logger";
import { expect } from "chai";
import * as nock from "nock";

import nocksetup from "./nocksetup";
import BrokerApi from "../../src/Coincheck/BrokerApi";
import MarginOpenStrategy from "../../src/Coincheck/MarginOpenStrategy";
import { createOrder } from "../helper";

options.enabled = false;

nocksetup();

describe("MarginOpenStrategy", function(){
  it("send leverage buy limit", async () => {
    const strategy = new MarginOpenStrategy(new BrokerApi("", ""));
    const order = createOrder(
      "Coincheck",
      "Buy",
      0.005,
      300000,
      "MarginOpen",
      "Limit",
      undefined as any);
    await strategy.send(order);
    expect(order.status).to.equal("New");
    expect(order.brokerOrderId).to.equal("340622252");
  });

  it("send fails - not MarginOpen order", async () => {
    const strategy = new MarginOpenStrategy(new BrokerApi("", ""));
    const order = createOrder(
      "Coincheck",
      "Buy",
      0.005,
      300000,
      "Cash",
      "Limit",
      undefined as any);
    try{
      await strategy.send(order);
    } catch(ex){
      return;
    }
    expect(false).to.equal(true);
  });

  it("send fails", async () => {
    const strategy = new MarginOpenStrategy(new BrokerApi("", ""));
    const order = createOrder(
      "Coincheck",
      "Buy",
      0.005,
      300000,
      "MarginOpen",
      "Limit",
      undefined as any);
    try{
      await strategy.send(order);
    } catch(ex){
      return;
    }
    expect(false).to.equal(true);
  });

  it("getBtcPosition Margin", async () => {
    const strategy = new MarginOpenStrategy(new BrokerApi("", ""));
    const result = await strategy.getBtcPosition();
    expect(result).to.equal(-0.14007);
  });

  it("open buy limit", () => {
    const strategy = new MarginOpenStrategy({} as BrokerApi);
    const order = {
      cashMarginType: "MarginOpen",
      side: "Buy",
      type: "Limit",
    };
    const target = strategy["getBrokerOrderType"](order as any);
    expect(target).to.equal("leverage_buy");
  });

  it("open sell limit", () => {
    const strategy = new MarginOpenStrategy({} as BrokerApi);
    const order = {
      cashMarginType: "MarginOpen",
      side: "Sell",
      type: "Limit",
    };
    const target = strategy["getBrokerOrderType"](order as any);
    expect(target).to.equal("leverage_sell");
  });

  it("open invalid side limit", () => {
    const strategy = new MarginOpenStrategy({} as BrokerApi);
    const order = {
      cashMarginType: "MarginOpen",
      side: "Invalid",
      type: "Limit",
    };
    expect(() => strategy["getBrokerOrderType"](order as any)).to.throw();
  });

  this.afterAll(() => {
    nock.restore();
  });
});
