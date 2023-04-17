// tslint:disable:variable-name
import { Castable, cast, element } from "@bitr/castable";

class PriceSizePair extends Castable {
  @cast price: number;
  @cast size: number;
}

export class BoardResponse extends Castable {
  @cast mid_price: number;
  @cast
  @element(PriceSizePair)
  bids: PriceSizePair[];
  @cast
  @element(PriceSizePair)
  asks: PriceSizePair[];
}

export interface SendChildOrderRequest {
  product_code: string;
  child_order_type: string;
  side: string;
  price?: number;
  size: number;
  minute_to_expire?: number;
  time_in_force?: string;
}

export class SendChildOrderResponse extends Castable {
  @cast child_order_acceptance_id: string;
}

export interface CancelChildOrderRequest {
  product_code: string;
  child_order_acceptance_id?: string;
  child_order_id?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CancelChildOrderResponse {}

export interface ExecutionsParam {
  product_code?: string;
  count?: number;
  before?: number;
  after?: number;
  child_order_id?: string;
  child_order_acceptance_id?: string;
}

export class Execution extends Castable {
  @cast id: number;
  @cast child_order_id: string;
  @cast side: string;
  @cast price: number;
  @cast size: number;
  @cast commission: number;
  @cast(Date) exec_date: Date;
  @cast child_order_acceptance_id: string;
}

export type ExecutionsResponse = Execution[];

export class Balance extends Castable {
  @cast currency_code: string;
  @cast amount: number;
  @cast available: number;
}

export type BalanceResponse = Balance[];

export interface ChildOrdersParam {
  product_code?: string;
  count?: number;
  before?: number;
  after?: number;
  child_order_state?: string;
  child_order_id?: string;
  child_order_acceptance_id?: string;
  parent_order_id?: string;
}

export class ChildOrder extends Castable {
  @cast id: number;
  @cast child_order_id: string;
  @cast product_code: string;
  @cast side: string;
  @cast child_order_type: string;
  @cast price: number;
  @cast average_price: number;
  @cast size: number;
  @cast child_order_state: string;
  @cast(Date) expire_date: Date;
  @cast(Date) child_order_date: Date;
  @cast child_order_acceptance_id: string;
  @cast outstanding_size: number;
  @cast cancel_size: number;
  @cast executed_size: number;
  @cast total_commission: number;
}

export type ChildOrdersResponse = ChildOrder[];
