import type BrokerApi from "./BrokerApi";
import type { CashMarginTypeStrategy } from "./types";
import type { Order } from "../types";

import * as _ from "lodash";

import { OrderStatus, OrderSide, CashMarginType } from "../types";
import { eRound } from "../util";


export default class MarginOpenStrategy implements CashMarginTypeStrategy {
  constructor(private readonly brokerApi: BrokerApi) {}

  async send(order: Order): Promise<void> {
    if(order.cashMarginType !== CashMarginType.MarginOpen){
      throw new Error();
    }
    const request = {
      pair: "btc_jpy",
      order_type: this.getBrokerOrderType(order),
      amount: order.size,
      rate: order.price,
    };
    const reply = await this.brokerApi.newOrder(request);
    if(!reply.success){
      throw new Error("Send failed.");
    }
    order.sentTime = reply.created_at;
    order.status = OrderStatus.New;
    order.brokerOrderId = reply.id;
    order.lastUpdated = new Date();
  }

  async getBtcPosition(): Promise<number> {
    const positions = await this.brokerApi.getAllOpenLeveragePositions();
    const longPosition = _.sumBy(positions.filter(p => p.side === "buy"), p => p.amount);
    const shortPosition = _.sumBy(positions.filter(p => p.side === "sell"), p => p.amount);
    return eRound(longPosition - shortPosition);
  }

  private getBrokerOrderType(order: Order): string {
    switch(order.side){
      case OrderSide.Buy:
        return "leverage_buy";
      case OrderSide.Sell:
        return "leverage_sell";
      default:
        throw new Error();
    }
  }
}
