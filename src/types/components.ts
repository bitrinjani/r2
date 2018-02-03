import { Quote, Broker, Order } from './common';
import { ConfigRoot } from './config';
import OrderImpl from '../OrderImpl';
import { TimeSeries } from '@bitr/chronodb';

export interface BrokerAdapter {
  broker: Broker;
  send(order: Order): Promise<void>;
  refresh(order: Order): Promise<void>;
  cancel(order: Order): Promise<void>;
  getBtcPosition(): Promise<number>;
  getPositions?: () => Promise<Map<string, number>>;
  fetchQuotes(): Promise<Quote[]>;
}

export interface BrokerMap<T> {
  [key: string]: T;
}

export type OrderPair = [OrderImpl, OrderImpl];

export interface SpreadAnalysisResult {
  bid: Quote;
  ask: Quote;
  invertedSpread: number;
  availableVolume: number;
  targetVolume: number;
  targetProfit: number;
  profitPercentAgainstNotional: number;
}

export interface SpreadStat {
  timestamp: number;
  byBroker: { [x: string]: { ask?: Quote; bid?: Quote; spread?: number } };
  bestCase: SpreadAnalysisResult;
  worstCase: SpreadAnalysisResult;
}

export interface LimitChecker {
  check(): LimitCheckResult;
}

export interface LimitCheckResult {
  success: boolean;
  reason: string;
  message: string;
}

export interface ConfigStore {
  config: ConfigRoot;
}

export interface BrokerPosition {
  broker: Broker;
  longAllowed: boolean;
  shortAllowed: boolean;
  baseCcyPosition: number;
  allowedLongSize: number;
  allowedShortSize: number;
}

export type OrderPairKeyValue = { key: string; value: OrderPair };

export interface ActivePairStore {
  get(key: string): Promise<OrderPair>;
  getAll(): Promise<OrderPairKeyValue[]>;
  put(value: OrderPair): Promise<string>;
  del(key: string): Promise<void>;
  delAll(): Promise<{}>;
}

export interface SpreadStatTimeSeries extends TimeSeries<SpreadStat> {}
