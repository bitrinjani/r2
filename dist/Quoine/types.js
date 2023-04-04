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
exports.AccountBalance = exports.ClosingTrade = exports.PriceLevelsResponse = exports.TradingAccount = exports.OrdersResponse = exports.Execution = exports.SendOrderResponse = void 0;
// tslint:disable:variable-name
const castable_1 = require("@bitr/castable");
class SendOrderResponse extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "order_type", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "quantity", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "disc_quantity", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "iceberg_total_quantity", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "side", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "filled_quantity", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], SendOrderResponse.prototype, "price", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], SendOrderResponse.prototype, "created_at", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], SendOrderResponse.prototype, "updated_at", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "status", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], SendOrderResponse.prototype, "leverage_level", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "source_exchange", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "product_id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "product_code", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "funding_currency", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Object)
], SendOrderResponse.prototype, "crypto_account_id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "currency_pair_code", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "average_price", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "target", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "order_fee", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SendOrderResponse.prototype, "source_action", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Object)
], SendOrderResponse.prototype, "unwound_trade_id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Object)
], SendOrderResponse.prototype, "trade_id", void 0);
exports.SendOrderResponse = SendOrderResponse;
class Execution extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Execution.prototype, "id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Execution.prototype, "quantity", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Execution.prototype, "price", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Execution.prototype, "taker_side", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], Execution.prototype, "created_at", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], Execution.prototype, "my_side", void 0);
exports.Execution = Execution;
class OrdersResponse extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "order_type", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "quantity", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "disc_quantity", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "iceberg_total_quantity", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "side", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "filled_quantity", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], OrdersResponse.prototype, "price", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], OrdersResponse.prototype, "created_at", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], OrdersResponse.prototype, "updated_at", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "status", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], OrdersResponse.prototype, "leverage_level", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "source_exchange", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "product_id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "product_code", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "funding_currency", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Object)
], OrdersResponse.prototype, "crypto_account_id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "currency_pair_code", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "average_price", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "target", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "order_fee", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "source_action", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Object)
], OrdersResponse.prototype, "unwound_trade_id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OrdersResponse.prototype, "trade_id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Object)
], OrdersResponse.prototype, "settings", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], OrdersResponse.prototype, "trailing_stop_type", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], OrdersResponse.prototype, "trailing_stop_value", void 0);
__decorate([
    castable_1.cast,
    (0, castable_1.element)(Execution),
    __metadata("design:type", Array)
], OrdersResponse.prototype, "executions", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Object)
], OrdersResponse.prototype, "stop_triggered_time", void 0);
exports.OrdersResponse = OrdersResponse;
class TradingAccount extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], TradingAccount.prototype, "id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], TradingAccount.prototype, "leverage_level", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], TradingAccount.prototype, "max_leverage_level", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], TradingAccount.prototype, "current_leverage_level", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], TradingAccount.prototype, "pnl", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], TradingAccount.prototype, "equity", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], TradingAccount.prototype, "margin", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], TradingAccount.prototype, "free_margin", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], TradingAccount.prototype, "trader_id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], TradingAccount.prototype, "status", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], TradingAccount.prototype, "product_code", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], TradingAccount.prototype, "currency_pair_code", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], TradingAccount.prototype, "position", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], TradingAccount.prototype, "balance", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], TradingAccount.prototype, "created_at", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], TradingAccount.prototype, "updated_at", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], TradingAccount.prototype, "pusher_channel", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], TradingAccount.prototype, "margin_percent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], TradingAccount.prototype, "product_id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], TradingAccount.prototype, "funding_currency", void 0);
exports.TradingAccount = TradingAccount;
class PriceLevelsResponse extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    (0, castable_1.element)(Array, Number),
    __metadata("design:type", Array)
], PriceLevelsResponse.prototype, "buy_price_levels", void 0);
__decorate([
    castable_1.cast,
    (0, castable_1.element)(Array, Number),
    __metadata("design:type", Array)
], PriceLevelsResponse.prototype, "sell_price_levels", void 0);
exports.PriceLevelsResponse = PriceLevelsResponse;
class ClosingTrade extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], ClosingTrade.prototype, "currency_pair_code", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], ClosingTrade.prototype, "status", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], ClosingTrade.prototype, "side", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "margin_used", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "open_quantity", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "close_quantity", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "quantity", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "leverage_level", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], ClosingTrade.prototype, "product_code", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "product_id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "open_price", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "close_price", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "trader_id", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "open_pnl", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "close_pnl", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "pnl", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "stop_loss", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "take_profit", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], ClosingTrade.prototype, "funding_currency", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "created_at", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "updated_at", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ClosingTrade.prototype, "total_interest", void 0);
exports.ClosingTrade = ClosingTrade;
class AccountBalance extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], AccountBalance.prototype, "currency", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], AccountBalance.prototype, "balance", void 0);
exports.AccountBalance = AccountBalance;
