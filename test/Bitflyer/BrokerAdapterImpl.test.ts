import type { BrokerConfigType } from "../../src/types";

import { options } from "@bitr/logger";
import { expect } from "chai";
import * as _ from "lodash";
import * as nock from "nock";

import nocksetup from "./nocksetup";
import BrokerAdapterImpl from "../../src/Bitflyer/BrokerAdapterImpl";
import { OrderStatus, CashMarginType, OrderSide, OrderType, TimeInForce } from "../../src/types";
import { createOrder } from "../helper";

options.enabled = false;

nocksetup();

describe("BrokerAdapterImpl", function() {
  this.afterAll(() => {
    nock.restore();
  });

  const brokerConfig = {
    broker: "Bitflyer",
    key: "",
    secret: "",
    cashMarginType: CashMarginType.Cash,
  } as BrokerConfigType;

  describe("Bitflyer BrokerAdapter", () => {
    it("getBtcPosition", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const result = await target.getBtcPosition();
      expect(result).to.equal(0.01084272);
    });

    it("getBtcPosition throws", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      try{
        const result = await target.getBtcPosition();
      } catch(ex){
        expect(ex.message).to.equal("Btc balance is not found.");
        return;
      }
      expect(false).to.equal(true);
    });

    it("fetchQuotes", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const result = await target.fetchQuotes();
      expect(result.length).to.equal(4);
      result.forEach(q => expect(q.broker).to.equal("Bitflyer"));
    });

    it("fetchQuotes throws", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      try{
        const result = await target.fetchQuotes();
      } catch(ex){
        return;
      }
      expect(true).to.equal(false);
    });

    it("send wrong broker order", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const order = { broker: "Coincheck" };
      try{
        await target.send(order as any);
      } catch(ex){
        return;
      }
      expect(false).to.equal(true);
    });

    it("send wrong cashMarginType", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const order = { broker: "Bitflyer", cashMarginType: CashMarginType.MarginOpen, symbol: "ZZZ" };
      try{
        await target.send(order as any);
      } catch(ex){
        return;
      }
      expect(false).to.equal(true);
    });

    it("send wrong symbol order", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const order = { broker: "Bitflyer", cashMarginType: CashMarginType.Cash, symbol: "ZZZ" };
      try{
        await target.send(order as any);
      } catch(ex){
        return;
      }
      expect(false).to.equal(true);
    });

    it("send StopLimit order", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const order = {
        broker: "Bitflyer",
        cashMarginType: CashMarginType.Cash,
        symbol: "BTC/JPY",
        type: OrderType.StopLimit,
      };
      try{
        await target.send(order as any);
      } catch(ex){
        return;
      }
      expect(false).to.equal(true);
    });

    it("send wrong time in force", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const order = {
        broker: "Bitflyer",
        cashMarginType: CashMarginType.Cash,
        symbol: "BTC/JPY",
        type: OrderType.Market,
        timeInForce: "MOCK",
      };
      try{
        await target.send(order as any);
      } catch(ex){
        return;
      }
      expect(false).to.equal(true);
    });

    it("cancel", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const order = { symbol: "BTC/JPY", brokerOrderId: "JRF20150707-033333-099999" };
      await target.cancel(order as any);
      expect((order as any).status).to.equal(OrderStatus.Canceled);
    });

    it("cancel wrong symbol", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const order = { symbol: "MOCK" };
      try{
        await target.cancel(order as any);
      } catch(ex){
        return;
      }
      expect(false).to.equal(true);
    });

    it("send buy limit", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const order = createOrder("Bitflyer", OrderSide.Buy, 0.1, 30000, CashMarginType.Cash, OrderType.Limit, undefined as any);
      await target.send(order);
      expect(order.status).to.equal(OrderStatus.New);
      expect(order.brokerOrderId).to.equal("JRF20150707-050237-639234");
    });

    it("send buy limit Fok", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const order = createOrder("Bitflyer", OrderSide.Buy, 0.1, 30000, CashMarginType.Cash, OrderType.Limit, undefined as any);
      order.timeInForce = TimeInForce.Fok;
      await target.send(order);
      expect(order.status).to.equal(OrderStatus.New);
      expect(order.brokerOrderId).to.equal("JRF20150707-050237-639234");
    });

    it("send buy limit Ioc", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const order = createOrder("Bitflyer", OrderSide.Buy, 0.1, 30000, CashMarginType.Cash, OrderType.Limit, undefined as any);
      order.timeInForce = TimeInForce.Ioc;
      await target.send(order);
      expect(order.status).to.equal(OrderStatus.New);
      expect(order.brokerOrderId).to.equal("JRF20150707-050237-639234");
    });

    it("refresh", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const order = {
        symbol: "BTC/JPY",
        type: "Limit",
        timeInForce: "None",
        id: "438f7c7b-ed72-4719-935f-477ea043e2b0",
        status: "New",
        creationTime: "2017-11-03T09:20:06.687Z",
        executions: [],
        broker: "Bitflyer",
        size: 0.01,
        side: "Sell",
        price: 846700,
        cashMarginType: "Cash",
        brokerOrderId: "JRF20171103-092007-284294",
        sentTime: "2017-11-03T09:20:07.292Z",
        lastUpdated: "2017-11-03T09:20:07.292Z",
      };
      await target.refresh(order as any);
      expect(order.status).to.equal(OrderStatus.Filled);
    });

    it("refresh Expired", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const order = {
        symbol: "BTC/JPY",
        type: "Limit",
        timeInForce: "None",
        id: "438f7c7b-ed72-4719-935f-477ea043e2b0",
        status: "New",
        creationTime: "2017-11-03T09:20:06.687Z",
        executions: [],
        broker: "Bitflyer",
        size: 0.01,
        side: "Sell",
        price: 846700,
        cashMarginType: "Cash",
        brokerOrderId: "JRF12345",
        sentTime: "2017-11-03T09:20:07.292Z",
        lastUpdated: "2017-11-03T09:20:07.292Z",
      };
      await target.refresh(order as any);
      expect(order.status).to.equal(OrderStatus.Expired);
    });

    it("refresh Canceled", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const order = {
        symbol: "BTC/JPY",
        type: "Limit",
        timeInForce: "None",
        id: "438f7c7b-ed72-4719-935f-477ea043e2b0",
        status: "New",
        creationTime: "2017-11-03T09:20:06.687Z",
        executions: [],
        broker: "Bitflyer",
        size: 0.01,
        side: "Sell",
        price: 846700,
        cashMarginType: "Cash",
        brokerOrderId: "JRF12345",
        sentTime: "2017-11-03T09:20:07.292Z",
        lastUpdated: "2017-11-03T09:20:07.292Z",
      };
      await target.refresh(order as any);
      expect(order.status).to.equal(OrderStatus.Canceled);
    });

    it("refresh Partially filled", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const order = {
        symbol: "BTC/JPY",
        type: "Limit",
        timeInForce: "None",
        id: "438f7c7b-ed72-4719-935f-477ea043e2b0",
        status: "New",
        creationTime: "2017-11-03T09:20:06.687Z",
        executions: [],
        broker: "Bitflyer",
        size: 0.01,
        side: "Sell",
        price: 846700,
        cashMarginType: "Cash",
        brokerOrderId: "JRF12345",
        sentTime: "2017-11-03T09:20:07.292Z",
        lastUpdated: "2017-11-03T09:20:07.292Z",
      };
      await target.refresh(order as any);
      expect(order.status).to.equal(OrderStatus.PartiallyFilled);
    });

    it("refresh unknown order id", async () => {
      const target = new BrokerAdapterImpl(brokerConfig);
      const order = {
        symbol: "BTC/JPY",
        type: "Limit",
        timeInForce: "None",
        id: "438f7c7b-ed72-4719-935f-477ea043e2b0",
        status: "New",
        creationTime: "2017-11-03T09:20:06.687Z",
        executions: [],
        broker: "Bitflyer",
        size: 0.01,
        side: "Sell",
        price: 846700,
        cashMarginType: "Cash",
        brokerOrderId: "MOCK",
        sentTime: "2017-11-03T09:20:07.292Z",
        lastUpdated: "2017-11-03T09:20:07.292Z",
      };
      await target.refresh(order as any);
      expect(order.status).to.equal(OrderStatus.New);
    });
  });
});
