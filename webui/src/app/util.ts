import { Order } from './types';
import * as _ from 'lodash';
import OrderImpl from './OrderImpl';

export function getAverageFilledPrice(order: Order) {
  return _.isEmpty(order.executions)
    ? 0
    : _.sumBy(order.executions, x => x.size * x.price) / _.sumBy(order.executions, x => x.size);
}

export function revive<T, K>(T: Function, o: K): T {
  const newObject = Object.create(T.prototype);
  return Object.assign(newObject, o) as T;
}

export function eRound(n: number): number {
  return _.round(n, 10);
}

export function splitSymbol(symbol: string): { baseCcy: string; quoteCcy: string } {
  const [baseCcy, quoteCcy] = symbol.split('/');
  return { baseCcy, quoteCcy };
}


