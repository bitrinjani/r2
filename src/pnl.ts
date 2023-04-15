import type { ConfigRoot } from "./config";
import type OrderImpl from "./orderImpl";


import _ from "lodash";

import { findBrokerConfig } from "./config";
import { OrderSide } from "./types";

export function calcCommission(price: number, volume: number, commissionPercent: number): number {
  return commissionPercent !== undefined ? price * volume * (commissionPercent / 100) : 0;
}

export function calcProfit(orders: OrderImpl[], config: ConfigRoot): { profit: number, commission: number } {
  const commission = _(orders).sumBy(o => {
    const brokerConfig = findBrokerConfig(config, o.broker);
    return calcCommission(o.averageFilledPrice, o.filledSize, brokerConfig.commissionPercent);
  });
  const profit = _(orders).sumBy(o => (o.side === OrderSide.Sell ? 1 : -1) * o.filledNotional) - commission;
  return { profit, commission };
}
