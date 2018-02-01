import { Broker, OrderSide, CashMarginType, OrderType } from '../types';
import OrderImpl from '../OrderImpl';

export function createOrder(
  broker: Broker,
  side: OrderSide,
  size: number,
  price: number,
  cashMarginType: CashMarginType,
  type: OrderType,
  leverageLevel: number
) {
  return new OrderImpl({
    symbol: 'BTC/JPY',
    broker,
    side,
    size,
    price,
    cashMarginType,
    type,
    leverageLevel
  });
}