import type OrderImpl from "../OrderImpl";

export interface QuoteData {
  asks: Quote[];
  bids: Quote[];
}

export interface QuoteDataMap {
  [broker: string]: QuoteData;
}

export interface BrokerQuoteMap {
  [broker: string]: Quote[];
}

export interface BrokerQuoteMapHistory {
  [broker: string]: Quote[][];
}

export interface AnalysisResult {
  bestAsk: Quote;
  bestBid: Quote;
  spread: number;
  size: number;
  expectedProfit: number;
}

export enum Status {
  Green,
  Yellow,
  Red
}

export interface BrokerStatus {
  status: Status;
  delay: number;
  quoteAge: number;
  message: string;
  spread: number;
}

export interface BrokerStatusMap {
  [broker: string]: BrokerStatus;
}

export interface QuoteResponse {
  brokerQuoteMap: BrokerQuoteMap;
  analysisResult: AnalysisResult;
  brokerStatusMap: BrokerStatusMap;
  foldedQuotes: Quote[];
}

export interface InitQuoteResponse {
  history: BrokerQuoteMapHistory;
  analysisResult: AnalysisResult;
  brokerStatusMap: BrokerStatusMap;
  foldedQuotes: Quote[];
}

export interface Log {
  level: string;
  msg: string;
  time: number;
  label: string;
}

export interface WsMessage<T> {
  type: string;
  body: T;
}

export interface Quote {
  broker: Broker;
  side: QuoteSide;
  price: number;
  volume: number;
}

export interface Execution {
  broker: Broker;
  brokerOrderId: string;
  cashMarginType: CashMarginType;
  size: number;
  price: number;
  execTime: Date;
  side: OrderSide;
  symbol: string;
}

export interface Order {
  broker: Broker;
  side: OrderSide;
  size: number;
  price: number;
  cashMarginType: CashMarginType;
  type: OrderType;
  leverageLevel?: number;
  id: string;
  symbol: string;
  timeInForce: TimeInForce;
  brokerOrderId: string;
  status: OrderStatus;
  filledSize: number;
  creationTime: Date;
  sentTime: Date;
  lastUpdated: Date;
  executions: Execution[];
  averageFilledPrice;
}

export enum OrderSide {
  Buy = "Buy",
  Sell = "Sell"
}

export enum TimeInForce {
  None = "None",
  Day = "Day",
  Gtc = "Gtc",
  Ioc = "Ioc",
  Fok = "Fok",
  Gtd = "Gtd"
}

export enum CashMarginType {
  Cash = "Cash",
  MarginOpen = "MarginOpen",
  NetOut = "NetOut"
}

export enum QuoteSide {
  Ask = "Ask",
  Bid = "Bid"
}

export enum OrderType {
  Market = "Market",
  Limit = "Limit",
  Stop = "Stop",
  StopLimit = "StopLimit"
}

export enum OrderStatus {
  New = "New",
  PartiallyFilled = "PartiallyFilled",
  Filled = "Filled",
  Canceled = "Canceled",
  PendingCancel = "PendingCancel",
  PendingAmend = "PendingAmend",
  PendingNew = "PendingNew",
  Rejected = "Rejected",
  Expired = "Expired"
}

export type Broker = string;

export interface BrokerMap<T> {
  [key: string]: T;
}

export interface BrokerPosition {
  broker: Broker;
  longAllowed: boolean;
  shortAllowed: boolean;
  baseCcyPosition: number;
  allowedLongSize: number;
  allowedShortSize: number;
}

export interface SpreadAnalysisResult {
  bid: Quote;
  ask: Quote;
  invertedSpread: number;
  availableVolume: number;
  targetVolume: number;
  targetProfit: number;
  profitPercentAgainstNotional: number;
}

export type OrderPair = [OrderImpl, OrderImpl];

export interface DepthLine {
  askBrokerCells: DepthBrokerCell[];
  askSizeCells: DepthSizeCell[];
  priceCell: DepthPriceCell;
  bidSizeCells: DepthSizeCell[];
  bidBrokerCells: DepthBrokerCell[];
  isBestAsk: boolean;
  isBestBid: boolean;
}

export interface DepthBrokerCell {
  value: string;
  tradable: boolean;
}

export interface DepthSizeCell {
  value: number;
  tradable: boolean;
}

export interface DepthPriceCell {
  value: number;
  askTradable: boolean;
  bidTradable: boolean;
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

export interface LogRecord {
  time: number;
  level: string;
  msg: string;
}

export interface LimitCheckResult {
  success: boolean;
  reason: string;
  message: string;
}
