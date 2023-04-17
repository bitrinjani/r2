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
