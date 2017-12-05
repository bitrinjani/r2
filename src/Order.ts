import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';
import {
  OrderSide, CashMarginType, OrderType,
  TimeInForce, OrderStatus, Broker
} from './types';
import Execution from './Execution';
import { eRound } from './util';

export default class Order {
  constructor(
    public broker: Broker,
    public side: OrderSide,
    public size: number,
    public price: number,
    public cashMarginType: CashMarginType,
    public type: OrderType,
    public leverageLevel: number) { }

  id: string = uuid();
  symbol: string = 'BTCJPY';
  timeInForce: TimeInForce = TimeInForce.None;
  brokerOrderId: string;
  status: OrderStatus = OrderStatus.PendingNew;
  filledSize: number;
  creationTime: Date = new Date();
  sentTime: Date;
  lastUpdated: Date;
  executions: Execution[] = [];

  get pendingSize(): number { return eRound(this.size - this.filledSize); }

  get averageFilledPrice(): number {
    return _.isEmpty(this.executions)
      ? 0
      : eRound(_.sumBy(this.executions, x => x.size * x.price) / _.sumBy(this.executions, x => x.size));
  }

  get filled(): boolean {
    return this.status === OrderStatus.Filled;
  }

  toString(): string {
    return JSON.stringify(this);
  }
}