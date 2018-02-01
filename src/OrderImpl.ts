import * as _ from 'lodash';
import { format } from 'util';
import { v4 as uuid } from 'uuid';
import { OrderSide, CashMarginType, OrderType, TimeInForce, OrderStatus, Broker, Order, Execution } from './types';
import { eRound, splitSymbol } from './util';
import t from './intl';

export interface Init {
  symbol: string;
  broker: Broker;
  side: OrderSide;
  size: number;
  price: number;
  cashMarginType: CashMarginType;
  type: OrderType;
  leverageLevel: number;
}

export default class OrderImpl implements Order {
  constructor(init: Init) {
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
  timeInForce: TimeInForce = TimeInForce.None;
  brokerOrderId: string;
  status: OrderStatus = OrderStatus.PendingNew;
  filledSize: number = 0;
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
    return this.status === OrderStatus.Filled;
  }

  get filledNotional(): number {
    return this.averageFilledPrice * this.filledSize;
  }

  toExecSummary(): string {
    const { baseCcy } = splitSymbol(this.symbol);
    return this.filled
      ? format(
          t`FilledSummary`,
          this.broker,
          this.side,
          this.filledSize,
          baseCcy,
          _.round(this.averageFilledPrice).toLocaleString()
        )
      : format(
          t`UnfilledSummary`,
          this.broker,
          this.side,
          this.size,
          baseCcy,
          this.price.toLocaleString(),
          this.pendingSize,
          baseCcy
        );
  }

  toShortString(): string {
    const { baseCcy } = splitSymbol(this.symbol);
    return `${this.broker} ${this.side} ${this.size} ${baseCcy}`;
  }

  toString(): string {
    return JSON.stringify(this);
  }
}
