// tslint:disable
import type { ConfigRoot, BrokerConfigType } from "../../src/types";

import { options } from "@bitr/logger";
import { expect } from "chai";
import * as _ from "lodash";
import * as nock from "nock";

import nocksetup from "./nocksetup";
import BrokerAdapterImpl from "../../src/Coincheck/BrokerAdapterImpl";
import { OrderStatus, CashMarginType, OrderSide, OrderType } from "../../src/types";
import { createOrder } from "../helper";

options.enabled = false;

nocksetup();

const brokerConfig = {
  broker: "Coincheck",
  key: "",
  secret: "",
  cashMarginType: CashMarginType.MarginOpen,
} as BrokerConfigType;

describe("Coincheck BrokerAdapter", function(){
  it("send with invalid cashMarginType", async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = createOrder(
      "Coincheck",
      OrderSide.Buy,
      0.005,
      300000,
      "Invalid" as CashMarginType,
      OrderType.Limit,
      // @ts-expect-error
      undefined
    );
    try{
      await target.send(order);
      expect(true).to.equal(false);
    } catch(ex){
      return;
    }
    expect(true).to.equal(false);
  });

  it("send leverage buy limit", async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = createOrder(
      "Coincheck",
      OrderSide.Buy,
      0.005,
      300000,
      CashMarginType.MarginOpen,
      OrderType.Limit,
      // @ts-expect-error
      undefined
    );
    await target.send(order);
    expect(order.status).to.equal(OrderStatus.New);
    expect(order.brokerOrderId).to.equal("340622252");
  });

  it("getBtcPosition with invalid cashMarginType", async () => {
    const config = {
      brokers: [{ broker: "Coincheck", key: "", secret: "", cashMarginType: "Invalid" as CashMarginType }],
    } as ConfigRoot;
    const target = new BrokerAdapterImpl(brokerConfig);
    try{
      await target.getBtcPosition();
      expect(true).to.equal(false);
    } catch(ex){
      return;
    }
    expect(true).to.equal(false);
  });

  it("getBtcPosition leverage", async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const result = await target.getBtcPosition();
    expect(result).to.equal(-0.14007);
  });

  it("refresh", async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: "BTC/JPY",
      type: "Limit",
      timeInForce: "None",
      id: "28f5d9f1-5e13-4bb7-845c-b1b7f02f5e64",
      status: "New",
      creationTime: "2017-10-28T01:20:39.320Z",
      executions: [],
      broker: "Coincheck",
      size: 0.01,
      side: "Buy",
      price: 663000,
      cashMarginType: "MarginOpen",
      sentTime: "2017-10-28T01:20:39.236Z",
      brokerOrderId: "361173028",
      lastUpdated: "2017-10-28T01:20:39.416Z",
    };
    await target.refresh(order as any);
    expect(order.status).to.equal(OrderStatus.Filled);
  });

  it("refresh partial fill", async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: "BTC/JPY",
      type: "Limit",
      timeInForce: "None",
      id: "28f5d9f1-5e13-4bb7-845c-b1b7f02f5e64",
      status: "New",
      creationTime: "2017-10-28T01:20:39.320Z",
      executions: [],
      broker: "Coincheck",
      size: 0.01,
      side: "Buy",
      price: 663000,
      cashMarginType: "MarginOpen",
      sentTime: "2017-10-28T01:20:39.236Z",
      brokerOrderId: "361173028",
      lastUpdated: "2017-10-28T01:20:39.416Z",
    };
    await target.refresh(order as any);
    expect(order.status).to.equal(OrderStatus.PartiallyFilled);
  });

  it("refresh partial fill", async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: "BTC/JPY",
      type: "Limit",
      timeInForce: "None",
      id: "28f5d9f1-5e13-4bb7-845c-b1b7f02f5e64",
      status: "New",
      creationTime: "2017-10-28T01:20:39.320Z",
      executions: [],
      broker: "Coincheck",
      size: 0.01,
      side: "Buy",
      price: 663000,
      cashMarginType: "MarginOpen",
      sentTime: "2017-10-28T01:20:39.236Z",
      brokerOrderId: "361173028",
      lastUpdated: "2017-10-28T01:20:39.416Z",
    };
    try{
      await target.refresh(order as any);
    } catch(ex){
      return;
    }
    expect(false).to.equal(true);
  });

  it("fetchQuotes", async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const result = await target.fetchQuotes();
    expect(result.length).to.equal(200);
    result.forEach(q => expect(q.broker).to.equal("Coincheck"));
  });

  it("send wrong broker order", async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = { broker: "Bitflyer" };
    try{
      await target.send(order as any);
    } catch(ex){
      return;
    }
    expect(false).to.equal(true);
  });

  it("cancel", async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = { brokerOrderId: "340809935" };
    await target.cancel(order as any);
    expect((order as any).status).to.equal(OrderStatus.Canceled);
  });

  it("cancel failed", async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = { brokerOrderId: "340809935" };
    try{
      await target.cancel(order as any);
    } catch(ex){
      return;
    }
    expect(false).to.equal(true);
  });

  this.afterAll(() => {
    nock.restore();
  });
});
