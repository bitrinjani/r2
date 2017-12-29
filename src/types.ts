﻿import BrokerPosition from './BrokerPosition';
import Order from './Order';
import Quote from './Quote';
import { Castable, cast, element } from '@bitr/castable';

export interface ConfigValidator {
  validate(config: ConfigRoot): void;
}

export interface BrokerAdapter {
  broker: Broker;
  send(order: Order): Promise<void>;
  refresh(order: Order): Promise<void>;
  cancel(order: Order): Promise<void>;
  getBtcPosition(): Promise<number>;
  fetchQuotes(): Promise<Quote[]>;
}

export interface BrokerMap<T> {
  [key: string]: T;
}

export interface QuoteAggregator {
  start(): Promise<void>;
  stop(): Promise<void>;
  onQuoteUpdated?: (quotes: Quote[]) => Promise<void>;
}

export interface SpreadAnalyzer {
  analyze(
    quotes: Quote[],
    positionMap: BrokerMap<BrokerPosition>,
    closingPair?: OrderPair
  ): Promise<SpreadAnalysisResult>;
}

export interface SpreadAnalysisResult {
  bestBid: Quote;
  bestAsk: Quote;
  invertedSpread: number;
  availableVolume: number;
  targetVolume: number;
  targetProfit: number;
  profitPercentAgainstNotional: number;
}

export interface LimitChecker {
  check(): LimitCheckResult;
}

export interface LimitCheckResult {
  success: boolean;
  reason: string;
}

export interface LimitCheckerFactory {
  create(spreadAnalysisResult: SpreadAnalysisResult, exit: boolean): LimitChecker;
}

export enum OrderSide {
  Buy = 'Buy',
  Sell = 'Sell'
}

export enum TimeInForce {
  None = 'None',
  Day = 'Day',
  Gtc = 'Gtc',
  Ioc = 'Ioc',
  Fok = 'Fok',
  Gtd = 'Gtd'
}

export enum CashMarginType {
  Cash = 'Cash',
  MarginOpen = 'MarginOpen',
  NetOut = 'NetOut'
}

export enum QuoteSide {
  Ask = 'Ask',
  Bid = 'Bid'
}

export enum OrderType {
  Market = 'Market',
  Limit = 'Limit',
  Stop = 'Stop',
  StopLimit = 'StopLimit'
}

export enum OrderStatus {
  New = 'New',
  PartiallyFilled = 'PartiallyFilled',
  Filled = 'Filled',
  Canceled = 'Canceled',
  PendingCancel = 'PendingCancel',
  PendingAmend = 'PendingAmend',
  PendingNew = 'PendingNew',
  Rejected = 'Rejected',
  Expired = 'Expired'
}

export interface Arbitrager {
  start(): Promise<void>;
  stop(): Promise<void>;
  status: string;
}

export interface ConfigStore {
  config: ConfigRoot;
}

export interface PositionService {
  start(): Promise<void>;
  stop(): Promise<void>;
  print(): void;
  netExposure: number;
  positionMap: BrokerMap<BrokerPosition>;
}

export interface BrokerAdapterRouter {
  send(order: Order): Promise<void>;
  refresh(order: Order): Promise<void>;
  cancel(order: Order): Promise<void>;
  getBtcPosition(broker: Broker): Promise<number>;
  fetchQuotes(broker: Broker): Promise<Quote[]>;
}

export enum Broker {
  None = 'None',
  Bitflyer = 'Bitflyer',
  Coincheck = 'Coincheck',
  Quoine = 'Quoine'
}

export class BrokerConfig extends Castable {
  @cast broker: Broker;
  @cast enabled: boolean;
  @cast key: string;
  @cast secret: string;
  @cast maxLongPosition: number;
  @cast maxShortPosition: number;
  @cast cashMarginType: CashMarginType;
  @cast leverageLevel: number;
  @cast commissionPercent: number;
}

export class SlackConfig extends Castable {
  @cast enabled: boolean;
  @cast url: string;
  @cast channel: string;
  @cast username: string;
  @cast
  @element(String)
  keywords: string[];
}

export class LineConfig extends Castable {
  @cast enabled: boolean;
  @cast token: string;
  @cast
  @element(String)
  keywords: string[];
}

export class LoggingConfig extends Castable {
  @cast slack: SlackConfig;
  @cast line: LineConfig;
}
export class OnSingleLegConfig extends Castable {
  @cast action: 'Cancel' | 'Reverse' | 'Proceed';
  @cast actionOnExit: 'Cancel' | 'Reverse' | 'Proceed';
  @cast options: CancelOption | ReverseOption | ProceedOption;
}

export type CancelOption = {};

export class ReverseOption extends Castable {
  @cast limitMovePercent: number;
  @cast ttl: number;
}

export class ProceedOption extends Castable {
  @cast limitMovePercent: number;
  @cast ttl: number;
}

export class ConfigRoot extends Castable {
  @cast language: string;
  @cast demoMode: boolean;
  @cast priceMergeSize: number;
  @cast maxSize: number;
  @cast minSize: number;
  @cast minTargetProfit: number;
  @cast minExitTargetProfit: number;
  @cast minTargetProfitPercent: number;
  @cast minExitTargetProfitPercent: number;
  @cast maxTargetProfit: number;
  @cast maxTargetProfitPercent: number;
  @cast maxTargetVolumePercent: number;
  @cast iterationInterval: number;
  @cast positionRefreshInterval: number;
  @cast sleepAfterSend: number;
  @cast maxNetExposure: number;
  @cast maxRetryCount: number;
  @cast orderStatusCheckInterval: number;
  @cast onSingleLeg: OnSingleLegConfig;
  @cast
  @element(BrokerConfig)
  brokers: BrokerConfig[];
  @cast logging: LoggingConfig;
}

export type OrderPair = [Order, Order];
