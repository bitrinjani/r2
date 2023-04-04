"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
class CashStrategy {
    constructor(brokerApi) {
        this.brokerApi = brokerApi;
    }
    send(order) {
        return __awaiter(this, void 0, void 0, function* () {
            if (order.cashMarginType !== types_1.CashMarginType.Cash) {
                throw new Error();
            }
            const request = {
                pair: 'btc_jpy',
                order_type: this.getBrokerOrderType(order),
                amount: order.size,
                rate: order.price
            };
            const reply = yield this.brokerApi.newOrder(request);
            if (!reply.success) {
                throw new Error('Send failed.');
            }
            order.sentTime = reply.created_at;
            order.status = types_1.OrderStatus.New;
            order.brokerOrderId = reply.id;
            order.lastUpdated = new Date();
        });
    }
    getBtcPosition() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.brokerApi.getAccountsBalance()).btc;
        });
    }
    getBrokerOrderType(order) {
        switch (order.side) {
            case types_1.OrderSide.Buy:
                switch (order.type) {
                    case types_1.OrderType.Market:
                        return 'market_buy';
                    case types_1.OrderType.Limit:
                        return 'buy';
                    default:
                        throw new Error();
                }
            case types_1.OrderSide.Sell:
                switch (order.type) {
                    case types_1.OrderType.Market:
                        return 'market_sell';
                    case types_1.OrderType.Limit:
                        return 'sell';
                    default:
                        throw new Error();
                }
            default:
                throw new Error();
        }
    }
}
exports.default = CashStrategy;
