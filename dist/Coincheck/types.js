"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsResponse = exports.Transaction = exports.Funds = exports.OpenOrdersResponse = exports.OpenOrder = exports.CancelOrderResponse = exports.NewOrderResponse = exports.OrderBooksResponse = exports.LeveragePositionsResponse = exports.LeveragePosition = exports.CloseOrder = exports.NewOrder = exports.Pagination = exports.LeverageBalanceResponse = exports.MarginAvailable = exports.Margin = exports.AccountsBalanceResponse = void 0;
// tslint:disable:variable-name
const castable_1 = require("@bitr/castable");
class AccountsBalanceResponse extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], AccountsBalanceResponse.prototype, "success", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "jpy", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "btc", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "usd", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "cny", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "eth", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "etc", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "dao", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "lsk", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "fct", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "xmr", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "rep", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "xrp", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "zec", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "xem", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "ltc", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "dash", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "bch", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "jpy_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "btc_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "usd_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "cny_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "eth_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "etc_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "dao_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "lsk_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "fct_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "xmr_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "rep_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "xrp_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "zec_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "xem_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "ltc_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "dash_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "bch_reserved", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "jpy_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "btc_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "usd_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "cny_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "eth_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "etc_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "dao_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "lsk_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "fct_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "xmr_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "rep_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "xrp_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "zec_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "xem_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "ltc_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "dash_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "bch_lend_in_use", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "jpy_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "btc_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "usd_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "cny_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "eth_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "etc_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "dao_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "lsk_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "fct_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "xmr_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "rep_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "xrp_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "zec_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "xem_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "ltc_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "dash_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "bch_lent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "jpy_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "btc_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "usd_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "cny_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "eth_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "etc_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "dao_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "lsk_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "fct_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "xmr_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "rep_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "xrp_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "zec_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "xem_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "ltc_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "dash_debt", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountsBalanceResponse.prototype, "bch_debt", void 0);
exports.AccountsBalanceResponse = AccountsBalanceResponse;
class Margin extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], Margin.prototype, "jpy", void 0);
exports.Margin = Margin;
class MarginAvailable extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], MarginAvailable.prototype, "jpy", void 0);
exports.MarginAvailable = MarginAvailable;
class LeverageBalanceResponse extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], LeverageBalanceResponse.prototype, "success", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Margin)
], LeverageBalanceResponse.prototype, "margin", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", MarginAvailable)
], LeverageBalanceResponse.prototype, "margin_available", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], LeverageBalanceResponse.prototype, "margin_level", void 0);
exports.LeverageBalanceResponse = LeverageBalanceResponse;
class Pagination extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], Pagination.prototype, "limit", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Pagination.prototype, "order", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Pagination.prototype, "starting_after", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Pagination.prototype, "ending_before", void 0);
exports.Pagination = Pagination;
class NewOrder extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], NewOrder.prototype, "id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], NewOrder.prototype, "side", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], NewOrder.prototype, "rate", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], NewOrder.prototype, "amount", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], NewOrder.prototype, "pending_amount", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], NewOrder.prototype, "status", void 0);
__decorate([
    (0, castable_1.cast)(Date),
    __metadata("design:type", Date)
], NewOrder.prototype, "created_at", void 0);
exports.NewOrder = NewOrder;
class CloseOrder extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], CloseOrder.prototype, "id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], CloseOrder.prototype, "side", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], CloseOrder.prototype, "rate", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], CloseOrder.prototype, "amount", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], CloseOrder.prototype, "pending_amount", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], CloseOrder.prototype, "status", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Date)
], CloseOrder.prototype, "created_at", void 0);
exports.CloseOrder = CloseOrder;
class LeveragePosition extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], LeveragePosition.prototype, "id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], LeveragePosition.prototype, "pair", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], LeveragePosition.prototype, "status", void 0);
__decorate([
    (0, castable_1.cast)(Date),
    __metadata("design:type", Date)
], LeveragePosition.prototype, "created_at", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Object)
], LeveragePosition.prototype, "closed_at", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], LeveragePosition.prototype, "open_rate", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], LeveragePosition.prototype, "closed_rate", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], LeveragePosition.prototype, "amount", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], LeveragePosition.prototype, "all_amount", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], LeveragePosition.prototype, "side", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], LeveragePosition.prototype, "pl", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", NewOrder)
], LeveragePosition.prototype, "new_order", void 0);
__decorate([
    castable_1.cast,
    (0, castable_1.element)(CloseOrder),
    __metadata("design:type", Array)
], LeveragePosition.prototype, "close_orders", void 0);
exports.LeveragePosition = LeveragePosition;
class LeveragePositionsResponse extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], LeveragePositionsResponse.prototype, "success", void 0);
__decorate([
    castable_1.cast,
    (0, castable_1.element)(LeveragePosition),
    __metadata("design:type", Array)
], LeveragePositionsResponse.prototype, "data", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Pagination)
], LeveragePositionsResponse.prototype, "pagination", void 0);
exports.LeveragePositionsResponse = LeveragePositionsResponse;
class OrderBooksResponse extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    (0, castable_1.element)(Array, Number),
    __metadata("design:type", Array)
], OrderBooksResponse.prototype, "asks", void 0);
__decorate([
    castable_1.cast,
    (0, castable_1.element)(Array, Number),
    __metadata("design:type", Array)
], OrderBooksResponse.prototype, "bids", void 0);
exports.OrderBooksResponse = OrderBooksResponse;
class NewOrderResponse extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], NewOrderResponse.prototype, "success", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], NewOrderResponse.prototype, "id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], NewOrderResponse.prototype, "rate", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], NewOrderResponse.prototype, "amount", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], NewOrderResponse.prototype, "order_type", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], NewOrderResponse.prototype, "stop_loss_rate", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], NewOrderResponse.prototype, "market_buy_amount", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], NewOrderResponse.prototype, "pair", void 0);
__decorate([
    (0, castable_1.cast)(Date),
    __metadata("design:type", Date)
], NewOrderResponse.prototype, "created_at", void 0);
exports.NewOrderResponse = NewOrderResponse;
class CancelOrderResponse extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], CancelOrderResponse.prototype, "success", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], CancelOrderResponse.prototype, "id", void 0);
exports.CancelOrderResponse = CancelOrderResponse;
class OpenOrder extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OpenOrder.prototype, "id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OpenOrder.prototype, "order_type", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], OpenOrder.prototype, "rate", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OpenOrder.prototype, "pair", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], OpenOrder.prototype, "pending_amount", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], OpenOrder.prototype, "pending_market_buy_amount", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], OpenOrder.prototype, "stop_loss_rate", void 0);
__decorate([
    (0, castable_1.cast)(Date),
    __metadata("design:type", Date)
], OpenOrder.prototype, "created_at", void 0);
exports.OpenOrder = OpenOrder;
class OpenOrdersResponse extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], OpenOrdersResponse.prototype, "success", void 0);
__decorate([
    castable_1.cast,
    (0, castable_1.element)(OpenOrder),
    __metadata("design:type", Array)
], OpenOrdersResponse.prototype, "orders", void 0);
exports.OpenOrdersResponse = OpenOrdersResponse;
class Funds extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], Funds.prototype, "btc", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], Funds.prototype, "jpy", void 0);
exports.Funds = Funds;
class Transaction extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Transaction.prototype, "id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Transaction.prototype, "order_id", void 0);
__decorate([
    (0, castable_1.cast)(Date),
    __metadata("design:type", Date)
], Transaction.prototype, "created_at", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Funds)
], Transaction.prototype, "funds", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Transaction.prototype, "pair", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], Transaction.prototype, "rate", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], Transaction.prototype, "fee_currency", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], Transaction.prototype, "fee", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], Transaction.prototype, "liquidity", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Transaction.prototype, "side", void 0);
exports.Transaction = Transaction;
class TransactionsResponse extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], TransactionsResponse.prototype, "success", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Pagination)
], TransactionsResponse.prototype, "pagination", void 0);
__decorate([
    castable_1.cast,
    (0, castable_1.element)(Transaction),
    __metadata("design:type", Array)
], TransactionsResponse.prototype, "data", void 0);
exports.TransactionsResponse = TransactionsResponse;
