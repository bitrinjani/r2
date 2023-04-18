import { options } from "@bitr/logger";
import { expect } from "chai";
import * as nock from "nock";

import nocksetup from "./nocksetup";
import BrokerApi from "../../src/Coincheck/BrokerApi";
import CashStrategy from "../../src/Coincheck/CashStrategy";
import { createOrder } from "../helper";

options.enabled = false;

nocksetup();

describe("CashStrategy", function(){
  it("send buy limit", async () => {
    const strategy = new CashStrategy(new BrokerApi("", ""));
    const order = createOrder(
      "Coincheck",
      "Buy",
      0.005,
      300000,
      "Cash",
      "Limit",
      undefined as any);
    await strategy.send(order);
    expect(order.status).to.equal("New");
    expect(order.brokerOrderId).to.equal("12345");
  });

  it("send fails - not Cash order", async () => {
    const strategy = new CashStrategy(new BrokerApi("", ""));
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

  it("getBtcPosition", async () => {
    const strategy = new CashStrategy(new BrokerApi("", ""));
    const result = await strategy.getBtcPosition();
    expect(result).to.equal(0.123);
  });

  it("cash market buy", () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: "Cash",
      side: "Buy",
      type: "Market",
    };
    const target = strategy["getBrokerOrderType"](order as any);
    expect(target).to.equal("market_buy");
  });

  it("cash limit buy", () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: "Cash",
      side: "Buy",
      type: "Limit",
    };
    const target = strategy["getBrokerOrderType"](order as any);
    expect(target).to.equal("buy");
  });

  it("cash invalid buy", () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: "Cash",
      side: "Buy",
      type: "StopLimit",
    };
    expect(() => strategy["getBrokerOrderType"](order as any)).to.throw();
  });

  it("cash sell market", () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: "Cash",
      side: "Sell",
      type: "Market",
    };
    const target = strategy["getBrokerOrderType"](order as any);
    expect(target).to.equal("market_sell");
  });

  it("cash sell limit", () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: "Cash",
      side: "Sell",
      type: "Limit",
    };
    const target = strategy["getBrokerOrderType"](order as any);
    expect(target).to.equal("sell");
  });

  it("cash sell invalid", () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: "Cash",
      side: "Sell",
      type: "Stop",
    };
    expect(() => strategy["getBrokerOrderType"](order as any)).to.throw();
  });

  it("cash invalid side", () => {
    const strategy = new CashStrategy({} as BrokerApi);
    const order = {
      cashMarginType: "Cash",
      side: "Invalid",
      type: "Stop",
    };
    expect(() => strategy["getBrokerOrderType"](order as any)).to.throw();
  });

  this.afterAll(() => {
    nock.restore();
  });
});
