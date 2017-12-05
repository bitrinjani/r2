import { v4 as uuid } from 'uuid';
import Order from './Order';
import { Broker, CashMarginType, OrderSide } from './types';

export default class Execution {
  constructor(order: Order) {
    this.broker = order.broker;
    this.brokerOrderId = order.brokerOrderId;
    this.cashMarginType = order.cashMarginType;
    this.side = order.side;
    this.symbol = order.symbol;
  }

  id: string =  uuid();
  broker: Broker = Broker.None;
  brokerOrderId: string;
  cashMarginType: CashMarginType;
  size: number;
  price: number;
  execTime: Date;
  side: OrderSide;
  symbol: string;
}