// tslint:disable:variable-name
import { TypeConverter, cast, element } from '../TypeConverter';

export class AccountsBalanceResponse extends TypeConverter {
  @cast success: boolean;
  @cast jpy: number;
  @cast btc: number;
  @cast usd: number;
  @cast cny: number;
  @cast eth: number;
  @cast etc: number;
  @cast dao: number;
  @cast lsk: number;
  @cast fct: number;
  @cast xmr: number;
  @cast rep: number;
  @cast xrp: number;
  @cast zec: number;
  @cast xem: number;
  @cast ltc: number;
  @cast dash: number;
  @cast bch: number;
  @cast jpy_reserved: number;
  @cast btc_reserved: number;
  @cast usd_reserved: number;
  @cast cny_reserved: number;
  @cast eth_reserved: number;
  @cast etc_reserved: number;
  @cast dao_reserved: number;
  @cast lsk_reserved: number;
  @cast fct_reserved: number;
  @cast xmr_reserved: number;
  @cast rep_reserved: number;
  @cast xrp_reserved: number;
  @cast zec_reserved: number;
  @cast xem_reserved: number;
  @cast ltc_reserved: number;
  @cast dash_reserved: number;
  @cast bch_reserved: number;
  @cast jpy_lend_in_use: number;
  @cast btc_lend_in_use: number;
  @cast usd_lend_in_use: number;
  @cast cny_lend_in_use: number;
  @cast eth_lend_in_use: number;
  @cast etc_lend_in_use: number;
  @cast dao_lend_in_use: number;
  @cast lsk_lend_in_use: number;
  @cast fct_lend_in_use: number;
  @cast xmr_lend_in_use: number;
  @cast rep_lend_in_use: number;
  @cast xrp_lend_in_use: number;
  @cast zec_lend_in_use: number;
  @cast xem_lend_in_use: number;
  @cast ltc_lend_in_use: number;
  @cast dash_lend_in_use: number;
  @cast bch_lend_in_use: number;
  @cast jpy_lent: number;
  @cast btc_lent: number;
  @cast usd_lent: number;
  @cast cny_lent: number;
  @cast eth_lent: number;
  @cast etc_lent: number;
  @cast dao_lent: number;
  @cast lsk_lent: number;
  @cast fct_lent: number;
  @cast xmr_lent: number;
  @cast rep_lent: number;
  @cast xrp_lent: number;
  @cast zec_lent: number;
  @cast xem_lent: number;
  @cast ltc_lent: number;
  @cast dash_lent: number;
  @cast bch_lent: number;
  @cast jpy_debt: number;
  @cast btc_debt: number;
  @cast usd_debt: number;
  @cast cny_debt: number;
  @cast eth_debt: number;
  @cast etc_debt: number;
  @cast dao_debt: number;
  @cast lsk_debt: number;
  @cast fct_debt: number;
  @cast xmr_debt: number;
  @cast rep_debt: number;
  @cast xrp_debt: number;
  @cast zec_debt: number;
  @cast xem_debt: number;
  @cast ltc_debt: number;
  @cast dash_debt: number;
  @cast bch_debt: number;
}

export class Pagination extends TypeConverter {
  @cast limit: number;
  @cast order: 'desc' | 'asc';
  @cast starting_after: string;
  @cast ending_before: string;
}

export interface LeveragePositionsRequest extends Partial<Pagination> {
  status?: 'open' | 'closed';
}

export class NewOrder extends TypeConverter {
  @cast id: string;
  @cast side: string;
  @cast rate?: number;
  @cast amount?: number;
  @cast pending_amount: number;
  @cast status: string;
  @cast(Date) created_at: Date;
}

export class CloseOrder extends TypeConverter {
  @cast id: string;
  @cast side: string;
  @cast rate: number;
  @cast amount: number;
  @cast pending_amount: number;
  @cast status: string;
  @cast created_at: Date;
}

export class LeveragePosition extends TypeConverter {
  @cast id: string;
  @cast pair: string;
  @cast status: string;
  @cast(Date) created_at: Date;
  @cast closed_at?: any;
  @cast open_rate: number;
  @cast closed_rate?: number;
  @cast amount: number;
  @cast all_amount: number;
  @cast side: string;
  @cast pl: number;
  @cast new_order: NewOrder;
  @cast @element(CloseOrder) close_orders: CloseOrder[];
}

export class LeveragePositionsResponse extends TypeConverter {
  @cast success: boolean;
  @cast @element(LeveragePosition) data: LeveragePosition[];
  @cast pagination: Pagination;
}

export class OrderBooksResponse extends TypeConverter {
  @cast @element(Array, Number) asks: number[][];
  @cast @element(Array, Number) bids: number[][];
}

export interface NewOrderRequest {
  pair: string;
  order_type: string;
  rate?: number;
  amount?: number;
  market_buy_amount?: number;
  position_id?: string;
  stop_loss_rate?: number;
}

export class NewOrderResponse extends TypeConverter {
  @cast success: boolean;
  @cast id: string;
  @cast rate: number;
  @cast amount: number;
  @cast order_type: string;
  @cast stop_loss_rate?: number;
  @cast market_buy_amount?: number;
  @cast pair: string;
  @cast(Date) created_at: Date;
}

export class CancelOrderResponse extends TypeConverter {
  @cast success: boolean;
  @cast id: string;
}

export class OpenOrder extends TypeConverter {
  @cast id: string;
  @cast order_type: string;
  @cast rate?: number;
  @cast pair: string;
  @cast pending_amount: number;
  @cast pending_market_buy_amount: number;
  @cast stop_loss_rate: number;
  @cast(Date) created_at: Date;
}

export class OpenOrdersResponse extends TypeConverter {
  @cast success: boolean;
  @cast @element(OpenOrder) orders: OpenOrder[];
}

export class Funds extends TypeConverter {
  @cast btc: number;
  @cast jpy: number;
}

export class Transaction extends TypeConverter {
  @cast id: string;
  @cast order_id: string;
  @cast(Date) created_at: Date;
  @cast funds: Funds;
  @cast pair: string;
  @cast rate: number;
  @cast fee_currency: number;
  @cast fee: number;
  @cast liquidity: number;
  @cast side: string;
}

export class TransactionsResponse extends TypeConverter {
  @cast success: boolean;
  @cast pagination: Pagination;
  @cast @element(Transaction) data: Transaction[];
}
