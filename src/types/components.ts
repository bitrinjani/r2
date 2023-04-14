import type { Quote, Broker, Order } from "./common";
import type { ConfigRoot } from "./config";
import type { TimeSeries } from "../chrono";
import type OrderImpl from "../orderImpl";
import type { EventEmitter } from "events";

export interface BrokerAdapter {
  broker: Broker;
  send: (order: Order) => Promise<void>;
  refresh: (order: Order) => Promise<void>;
  cancel: (order: Order) => Promise<void>;
  getBtcPosition: () => Promise<number>;
  getPositions?: () => Promise<Map<string, number>>;
  fetchQuotes: () => Promise<Quote[]>;
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

export interface PairSummary {
  entryProfit: number;
  entryProfitRatio: number;
  currentExitCost?: number;
  currentExitCostRatio?: number;
  currentExitNetProfitRatio?: number;
}

export interface PairWithSummary {
  key: string;
  pair: OrderPair;
  pairSummary: PairSummary;
  exitAnalysisResult?: SpreadAnalysisResult;
}

export interface SpreadStat {
  timestamp: number;
  byBroker: { [x: string]: { ask?: Quote, bid?: Quote, spread?: number } };
  bestCase: SpreadAnalysisResult;
  worstCase: SpreadAnalysisResult;
}

export interface LimitChecker {
  check: () => LimitCheckResult;
}

export interface LimitCheckResult {
  success: boolean;
  reason: string;
  message: string;
}

export interface ConfigStore extends EventEmitter {
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

export type OrderPairKeyValue = { key: string, value: OrderPair };

export interface ActivePairStore extends EventEmitter {
  get: (key: string) => Promise<OrderPair>;
  getAll: () => Promise<OrderPairKeyValue[]>;
  put: (value: OrderPair) => Promise<string>;
  del: (key: string) => Promise<void>;
  delAll: () => Promise<{}>;
}

export type SpreadStatTimeSeries = TimeSeries<SpreadStat>;

export type OrderKeyValue = { key: string, value: Order };

export interface HistoricalOrderStore extends EventEmitter {
  get: (key: string) => Promise<Order>;
  getAll: () => Promise<OrderKeyValue[]>;
  put: (value: Order) => Promise<string>;
  del: (key: string) => Promise<void>;
  delAll: () => Promise<{}>;
}
