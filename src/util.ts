import type { Execution, Order, Broker, QuoteSide, Quote } from "./types";

import * as crypto from "crypto";
import * as querystring from "querystring";

import _ from "lodash";

interface ToStringable {
  toString: () => string;
}

export function padStart(s: ToStringable, n: number): string {
  return _.padStart(s.toString(), n);
}

export function padEnd(s: ToStringable, n: number): string {
  return _.padEnd(s.toString(), n);
}

export function hr(width: number): string {
  return _.join(_.times(width, _.constant("-")), "");
}

export function eRound(n: number): number {
  return _.round(n, 10);
}

export function almostEqual(a: number, b: number, tolerancePercent: number): boolean {
  return Math.sign(a) === Math.sign(b) && Math.abs(a - b) <= Math.abs(b) * (tolerancePercent / 100);
}

export function delay(time: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, time));
}

export function hmac(secret: string, text: string, algo: string = "sha256"): string {
  return crypto
    .createHmac(algo, secret)
    .update(text)
    .digest("hex");
}

export const nonce: () => string = (function() {
  let prev = 0;
  return function() {
    const n = Date.now();
    if(n <= prev){
      prev += 1;
      return prev.toString();
    }
    prev = n;
    return prev.toString();
  };
}());

export function safeQueryStringStringify(o: any) {
  const noUndefinedFields = _.pickBy(o, _.negate(_.isUndefined));
  return querystring.stringify(noUndefinedFields);
}

export function toExecution(order: Order): Partial<Execution> {
  return {
    broker: order.broker,
    brokerOrderId: order.brokerOrderId,
    cashMarginType: order.cashMarginType,
    side: order.side,
    symbol: order.symbol,
  };
}

export function toQuote(broker: Broker, side: QuoteSide, price: number, volume: number) {
  return { broker, side, price, volume };
}

export function splitSymbol(symbol: string): { baseCcy: string, quoteCcy: string } {
  const [baseCcy, quoteCcy] = symbol.split("/");
  return { baseCcy, quoteCcy };
}

export function formatQuote(quote: Quote) {
  return (
    `${padEnd(quote.broker, 10)} ${quote.side} `
    + `${padStart(quote.price.toLocaleString(), 7)} ${_.round(quote.volume, 3)}`
  );
}
