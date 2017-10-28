import Order from '../Order';
import { CashMarginType, OrderSide, OrderType } from '../type';

export function getBrokerOrderType(order: Order): string {
  switch (order.cashMarginType) {
    case CashMarginType.Cash:
      switch (order.side) {
        case OrderSide.Buy:
          switch (order.type) {
            case OrderType.Market:
              return 'market_buy';
            case OrderType.Limit:
              return 'buy';
            default:
              throw new Error();
          }
        case OrderSide.Sell:
          switch (order.type) {
            case OrderType.Market:
              return 'market_sell';
            case OrderType.Limit:
              return 'sell';
            default:
              throw new Error();
          }
        default:
          throw new Error();
      }
    case CashMarginType.MarginOpen:
      switch (order.side) {
        case OrderSide.Buy:
          return 'leverage_buy';
        case OrderSide.Sell:
          return 'leverage_sell';
        default:
          throw new Error();
      }
    case CashMarginType.MarginClose:
      switch (order.side) {
        case OrderSide.Buy:
          return 'close_short';
        case OrderSide.Sell:
          return 'close_long';
        default:
          throw new Error();
      }
    default:
      throw new Error();
  }
}