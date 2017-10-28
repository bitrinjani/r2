import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { OrderSide, CashMarginType, OrderType, 
  TimeInForce, OrderStatus, Broker } from './type';
import Execution from './Execution';

export default class Order {
  constructor(broker: Broker, side: OrderSide, size: number, price: number, 
              cashMarginType: CashMarginType, orderType: OrderType, leverageLevel: number) {
    this.broker = broker;
    this.size = size;
    this.side = side;
    this.price = price;
    this.cashMarginType = cashMarginType;
    this.type = orderType;
    this.leverageLevel = leverageLevel;
  }

  broker: Broker;
  side: OrderSide;
  symbol: string = 'BTCJPY';
  cashMarginType: CashMarginType;
  type: OrderType = OrderType.Limit;
  size: number;
  price: number;
  leverageLevel: number;
  timeInForce: TimeInForce = TimeInForce.None;
  id: string = uuid();
  brokerOrderId: string;
  status: OrderStatus = OrderStatus.PendingNew;
  get pendingSize(): number { return this.size - this.filledSize; }
  filledSize: number;
  get averageFilledPrice(): number {
    return _.isEmpty(this.executions)
      ? 0
      : _.sumBy(this.executions, x => x.size * x.price) / _.sumBy(this.executions, x => x.size);
  }
  creationTime: Date = new Date();
  sentTime: Date;
  lastUpdated: Date;
  executions: Execution[] = [];

  toString(): string {
    return JSON.stringify(this);
  }
}