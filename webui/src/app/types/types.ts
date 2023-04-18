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

export type Status = "Green" | "Yellow" | "Red";

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

export type OrderSide = "Buy" | "Sell";

export type TimeInForce =
  | "None"
  | "Day"
  | "Gtc"
  | "Ioc"
  | "Fok"
  | "Gtd";

export type CashMarginType = "Cash" | "MarginOpen" | "NetOut";

export type QuoteSide = "Ask" | "Bid";

export type OrderType = "Market" | "Limit" | "Stop" | "StopLimit";

export type OrderStatus =
  | "New"
  | "PartiallyFilled"
  | "Filled"
  | "Canceled"
  | "PendingCancel"
  | "PendingAmend"
  | "PendingNew"
  | "Rejected"
  | "Expired";

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
