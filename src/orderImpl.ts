import type {
  OrderSide,
  CashMarginType,
  OrderType,
  Broker,
  Order,
  Execution,
  TimeInForce,
  OrderStatus } from "./types";

import _ from "lodash";
import { v4 as uuid } from "uuid";

import { eRound } from "./util";

export interface OrderInit {
  symbol: string;
  broker: Broker;
  side: OrderSide;
  size: number;
  price: number;
  cashMarginType: CashMarginType;
  type: OrderType;
  leverageLevel: number;
}

// eslint-disable-next-line @typescript-eslint/ban-types
function revive<T, K>(t: Function, o: K): T {
  const newObject = Object.create(t.prototype);
  return Object.assign(newObject, o) as T;
}

export default class OrderImpl implements Order {
  constructor(init: OrderInit) {
    Object.assign(this, init);
  }

  broker: Broker;
  side: OrderSide;
  size: number;
  price: number;
  cashMarginType: CashMarginType;
  type: OrderType;
  leverageLevel: number;
  id: string = uuid();
  symbol: string;
  timeInForce: TimeInForce = "None";
  brokerOrderId: string;
  status: OrderStatus = "PendingNew";
  filledSize = 0;
  creationTime: Date = new Date();
  sentTime: Date;
  lastUpdated: Date;
  executions: Execution[] = [];

  get pendingSize(): number {
    return eRound(this.size - this.filledSize);
  }

  get averageFilledPrice(): number {
    return _.isEmpty(this.executions)
      ? 0
      : eRound(_.sumBy(this.executions, x => x.size * x.price) / _.sumBy(this.executions, x => x.size));
  }

  get filled(): boolean {
    return this.status === "Filled";
  }

  get filledNotional(): number {
    return this.averageFilledPrice * this.filledSize;
  }
}

export function reviveOrder(o: Order): OrderImpl {
  const r = revive<OrderImpl, Order>(OrderImpl, o);
  r.creationTime = new Date(r.creationTime);
  r.sentTime = new Date(r.sentTime);
  return r;
}
