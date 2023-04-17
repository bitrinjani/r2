import type { ChildOrdersParam, SendChildOrderRequest, ChildOrder } from "./types";
import type { BrokerConfigType } from "../config";
import type {
  BrokerAdapter,
  Order,
  Execution,
  Quote
} from "../types";

import { getLogger } from "@bitr/logger";
import _ from "lodash";

import "dotenv/config";
import BrokerApi from "./BrokerApi";
import { eRound, toExecution } from "../util";

export default class BrokerAdapterImpl implements BrokerAdapter {
  private readonly brokerApi: BrokerApi;
  private readonly log = getLogger("Bitflyer.BrokerAdapter");
  readonly broker = "Bitflyer";

  constructor(private readonly config: BrokerConfigType) {
    this.brokerApi = new BrokerApi(process.env.BITFLYER_TOKEN, process.env.BITFLYER_SECRET);
  }

  async send(order: Order): Promise<void> {
    if(order.broker !== this.broker){
      throw new Error();
    }
    const param = this.mapOrderToSendChildOrderRequest(order);
    const reply = await this.brokerApi.sendChildOrder(param);
    order.brokerOrderId = reply.child_order_acceptance_id;
    order.status = "New";
    order.sentTime = new Date();
    order.lastUpdated = new Date();
  }

  async refresh(order: Order): Promise<void> {
    const orderId = order.brokerOrderId;
    const request: ChildOrdersParam = { child_order_acceptance_id: orderId };
    const reply = await this.brokerApi.getChildOrders(request);
    const childOrder = reply[0];
    if(childOrder === undefined){
      const message = `Unable to find ${orderId}. GetOrderState failed.`;
      this.log.warn(message);
      return;
    }

    this.setOrderFields(childOrder, order);
    const executions = await this.brokerApi.getExecutions({ child_order_acceptance_id: orderId });
    order.executions = _.map(executions, x => {
      const e = toExecution(order);
      e.size = x.size;
      e.price = x.price;
      e.execTime = new Date(x.exec_date);
      return e as Execution;
    });

    order.lastUpdated = new Date();
  }

  async cancel(order: Order): Promise<void> {
    let productCode = "";
    switch(order.symbol){
      case "BTC/JPY":
        productCode = "BTC_JPY";
        break;
      default:
        throw new Error("Not implemented.");
    }
    const request = { product_code: productCode, child_order_acceptance_id: order.brokerOrderId };
    await this.brokerApi.cancelChildOrder(request);
    order.lastUpdated = new Date();
    order.status = "Canceled";
  }

  async getBtcPosition(): Promise<number> {
    const balanceResponse = await this.brokerApi.getBalance();
    const btcBalance = _.find(balanceResponse, b => b.currency_code === "BTC");
    if(!btcBalance){
      throw new Error("Btc balance is not found.");
    }
    return btcBalance.amount;
  }

  async fetchQuotes(): Promise<Quote[]> {
    return [];
  }

  private mapOrderToSendChildOrderRequest(order: Order): SendChildOrderRequest {
    if(order.cashMarginType !== "Cash"){
      throw new Error("Not implemented.");
    }

    let productCode = "";
    switch(order.symbol){
      case "BTC/JPY":
        productCode = "BTC_JPY";
        break;
      default:
        throw new Error("Not implemented.");
    }

    let price = 0;
    let childOrderType = "";
    switch(order.type){
      case "Limit":
        childOrderType = "LIMIT";
        price = order.price;
        break;
      case "Market":
        childOrderType = "MARKET";
        price = 0;
        break;
      default:
        throw new Error("Not implemented.");
    }

    let timeInForce;
    switch(order.timeInForce){
      case "None":
        timeInForce = "";
        break;
      case "Fok":
        timeInForce = "FOK";
        break;
      case "Ioc":
        timeInForce = "IOC";
        break;
      default:
        throw new Error("Not implemented.");
    }

    return {
      price,
      product_code: productCode,
      child_order_type: childOrderType,
      side: order.side.toUpperCase(),
      size: order.size,
      time_in_force: timeInForce,
    };
  }

  private setOrderFields(childOrder: ChildOrder, order: Order): void {
    order.filledSize = eRound(childOrder.executed_size);
    if(childOrder.child_order_state === "CANCELED"){
      order.status = "Canceled";
    }else if(childOrder.child_order_state === "EXPIRED"){
      order.status = "Expired";
    }else if(order.filledSize === order.size){
      order.status = "Filled";
    }else if(order.filledSize > 0){
      order.status = "PartiallyFilled";
    }
    order.lastUpdated = new Date();
  }

  private mapToQuote(): Quote[] {
    return [];
  }
} /* istanbul ignore next */
