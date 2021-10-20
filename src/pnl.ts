import OrderImpl from './OrderImpl';
import * as _ from 'lodash';
import Decimal from 'decimal.js';
import { findBrokerConfig } from './configUtil';
import { OrderSide, ConfigRoot } from './types';

export function calcCommission(price: number, volume: number, commissionPercent: number): Decimal {
  return commissionPercent !== undefined ? new Decimal(price).times(volume).times(commissionPercent).div(100) : new Decimal(0);
}

export function calcProfit(orders: OrderImpl[], config: ConfigRoot): { profit: number; commission: number } {
  const commission = _(orders).reduce((sum, o) => {
    const brokerConfig = findBrokerConfig(config, o.broker);
    return sum.add(calcCommission(o.averageFilledPrice, o.filledSize, brokerConfig.commissionPercent));
  }, new Decimal(0)).toNumber();
  const profit = new Decimal(-commission).add(_(orders).sumBy(o => (o.side === OrderSide.Sell ? 1 : -1) * o.filledNotional)).toNumber();
  return { profit, commission };
}