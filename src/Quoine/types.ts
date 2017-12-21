// tslint:disable:variable-name
import { Castable, cast, element } from '@bitr/castable'

export interface Order {
  order_type: string;
  product_id: string;
  side: string;
  quantity: number;
  price: number;
  leverage_level?: number;
  order_direction?: string;
}

export interface SendOrderRequest {
  order: Order;
}

export class SendOrderResponse extends Castable {
  @cast id: string;
  @cast order_type: string;
  @cast quantity: string;
  @cast disc_quantity: string;
  @cast iceberg_total_quantity: string;
  @cast side: string;
  @cast filled_quantity: string;
  @cast price: number;
  @cast created_at: number;
  @cast updated_at: number;
  @cast status: string;
  @cast leverage_level: number;
  @cast source_exchange: string;
  @cast product_id: string;
  @cast product_code: string;
  @cast funding_currency: string;
  @cast crypto_account_id?: any;
  @cast currency_pair_code: string;
  @cast average_price: string;
  @cast target: string;
  @cast order_fee: string;
  @cast source_action: string;
  @cast unwound_trade_id?: any;
  @cast trade_id?: any;
}

export type CancelOrderResponse = any;

export class Execution extends Castable {
  @cast id: string;
  @cast quantity: string;
  @cast price: string;
  @cast taker_side: string;
  @cast created_at: number;
  @cast my_side: string;
}

export class OrdersResponse extends Castable {
  @cast id: string;
  @cast order_type: string;
  @cast quantity: string;
  @cast disc_quantity: string;
  @cast iceberg_total_quantity: string;
  @cast side: string;
  @cast filled_quantity: string;
  @cast price: number;
  @cast created_at: number;
  @cast updated_at: number;
  @cast status: string;
  @cast leverage_level: number;
  @cast source_exchange: string;
  @cast product_id: string;
  @cast product_code: string;
  @cast funding_currency: string;
  @cast crypto_account_id?: any;
  @cast currency_pair_code: string;
  @cast average_price: string;
  @cast target: string;
  @cast order_fee: string;
  @cast source_action: string;
  @cast unwound_trade_id?: any;
  @cast trade_id: string;
  @cast settings?: any;
  @cast trailing_stop_type: boolean;
  @cast trailing_stop_value: boolean;
  @cast @element(Execution) executions: Execution[];
  @cast stop_triggered_time?: any;
}

export class TradingAccount extends Castable {
  @cast id: string;
  @cast leverage_level: number;
  @cast max_leverage_level: number;
  @cast current_leverage_level: number;
  @cast pnl: string;
  @cast equity: string;
  @cast margin: number;
  @cast free_margin: number;
  @cast trader_id: string;
  @cast status: string;
  @cast product_code: string;
  @cast currency_pair_code: string;
  @cast position: number;
  @cast balance: number;
  @cast created_at: number;
  @cast updated_at: number;
  @cast pusher_channel: string;
  @cast margin_percent: string;
  @cast product_id: string;
  @cast funding_currency: string;
}

export type TradingAccountsResponse = TradingAccount[];
export class PriceLevelsResponse extends Castable {
  @cast @element(Array, Number) buy_price_levels: number[][];
  @cast @element(Array, Number) sell_price_levels: number[][];
}

export type CloseAllResponse = ClosingTrade[];
export class ClosingTrade extends Castable {
  @cast id: number;
  @cast currency_pair_code: string;
  @cast status: string;
  @cast side: string;
  @cast margin_used: number;
  @cast open_quantity: number;
  @cast close_quantity: number;
  @cast quantity: number;
  @cast leverage_level: number;
  @cast product_code: string;
  @cast product_id: number;
  @cast open_price: number;
  @cast close_price: number;
  @cast trader_id: number;
  @cast open_pnl: number;
  @cast close_pnl: number;
  @cast pnl: number;
  @cast stop_loss: number;
  @cast take_profit: number;
  @cast funding_currency: string;
  @cast created_at: number;
  @cast updated_at: number;
  @cast total_interest: number;
}