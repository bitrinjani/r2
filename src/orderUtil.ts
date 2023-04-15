import type OrderImpl from "./orderImpl";

import { format } from "util";

import _ from "lodash";

import t from "./i18n";
import { splitSymbol } from "./util";


export function toExecSummary(order: OrderImpl): string {
  const { baseCcy } = splitSymbol(order.symbol);
  return order.filled
    ? format(
      t`FilledSummary`,
      order.broker,
      order.side,
      order.filledSize,
      baseCcy,
      _.round(order.averageFilledPrice).toLocaleString()
    )
    : format(
      t`UnfilledSummary`,
      order.broker,
      order.side,
      order.size,
      baseCcy,
      order.price.toLocaleString(),
      order.pendingSize,
      baseCcy
    );
}

export function toShortString(order: OrderImpl): string {
  const { baseCcy } = splitSymbol(order.symbol);
  return `${order.broker} ${order.side} ${order.size} ${baseCcy}`;
}
