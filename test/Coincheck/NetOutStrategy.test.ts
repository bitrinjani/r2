import type { NewOrderRequest } from "../../src/Coincheck/types";

import { options } from "@bitr/logger";
import { expect, spy } from "chai";
import * as nock from "nock";

import nocksetup from "./nocksetup";
import BrokerApi from "../../src/Coincheck/BrokerApi";
import NetOutStrategy from "../../src/Coincheck/NetOutStrategy";
import { CashMarginType, OrderSide, OrderType, OrderStatus } from "../../src/types";
import { createOrder } from "../helper";

options.enabled = false;

nocksetup();

describe("NetOutStrategy", function(){
  it("getBtcPosition Margin", async () => {
    const strategy = new NetOutStrategy(new BrokerApi("", ""));
    const result = await strategy.getBtcPosition();
    expect(result).to.equal(-0.14007);
  });

  it("send fails - not NetOut order", async () => {
    const strategy = new NetOutStrategy(new BrokerApi("", ""));
    const order = createOrder(
      "Coincheck",
      OrderSide.Buy,
      0.005,
      300000,
      CashMarginType.MarginOpen, OrderType.Limit, undefined as any);
    try{
      await strategy.send(order);
    } catch(ex){
      return;
    }
    expect(false).to.equal(true);
  });

  it("netout close_short", async () => {
    const strategy = new NetOutStrategy(new BrokerApi("", ""));
    const order = createOrder(
      "Coincheck",
      OrderSide.Buy,
      0.01,
      840000,
      CashMarginType.NetOut,
      OrderType.Limit,
      // @ts-expect-error
      undefined
    );
    const request: NewOrderRequest = await strategy["getNetOutRequest"](order);
    expect(request.order_type).to.equal("close_short");
    expect(request.amount).to.equal(0.010005);
    expect(request.position_id).to.equal(2389078);
    await strategy.send(order);
    expect(order.status).to.equal(OrderStatus.New);
    expect(order.brokerOrderId).to.equal("391699747");
  });

  it("netout request - open buy", async () => {
    const strategy = new NetOutStrategy(new BrokerApi("", ""));
    const order = createOrder(
      "Coincheck",
      OrderSide.Buy,
      0.02,
      840000,
      CashMarginType.NetOut,
      OrderType.Limit,
      // @ts-expect-error
      undefined
    );
    const request: NewOrderRequest = await strategy["getNetOutRequest"](order);
    expect(request.order_type).to.equal("leverage_buy");
    expect(request.amount).to.equal(0.02);
    expect(request.position_id).to.equal(undefined);
  });

  it("netout when no closable position", async () => {
    const strategy = new NetOutStrategy(new BrokerApi("", ""));
    const order = createOrder(
      "Coincheck",
      OrderSide.Sell,
      0.01,
      830000,
      CashMarginType.NetOut,
      OrderType.Limit,
      // @ts-expect-error
      undefined
    );
    const request: NewOrderRequest = await strategy["getNetOutRequest"](order);
    expect(request.order_type).to.equal("leverage_sell");
    expect(request.amount).to.equal(0.01);
    expect(request.position_id).to.equal(undefined);
    await strategy.send(order);
    expect(order.status).to.equal(OrderStatus.New);
    expect(order.brokerOrderId).to.equal("391697892");
  });

  it("netout market when no closable position", async () => {
    const strategy = new NetOutStrategy(new BrokerApi("", ""));
    const order = createOrder(
      "Coincheck",
      OrderSide.Sell,
      0.01,
      830000,
      CashMarginType.NetOut,
      OrderType.Market,
      // @ts-expect-error
      undefined
    );
    const request: NewOrderRequest = await strategy["getNetOutRequest"](order);
    expect(request.order_type).to.equal("leverage_sell");
    expect(request.amount).to.equal(0.01);
    expect(request.position_id).to.equal(undefined);
    expect(request.rate).to.equal(undefined);
  });

  it("netout non BTC/JPY", async () => {
    const strategy = new NetOutStrategy(new BrokerApi("", ""));
    const order = createOrder(
      "Coincheck",
      OrderSide.Sell,
      0.01,
      830000,
      CashMarginType.NetOut,
      OrderType.Limit,
      // @ts-expect-error
      undefined
    );
    order.symbol = "ZZZJPY";
    let fnCount = 0;
    const fn = spy(() => ++fnCount);
    try{
      await strategy["getNetOutRequest"](order);
      expect(true).to.equal(false);
    } catch(ex){
      fn();
    }
    expect(fnCount).to.equal(1);
  });

  this.afterAll(() => {
    nock.restore();
  });
});
