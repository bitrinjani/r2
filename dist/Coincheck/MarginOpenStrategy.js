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
const util_1 = require("../util");
const _ = require("lodash");
class MarginOpenStrategy {
    constructor(brokerApi) {
        this.brokerApi = brokerApi;
    }
    send(order) {
        return __awaiter(this, void 0, void 0, function* () {
            if (order.cashMarginType !== types_1.CashMarginType.MarginOpen) {
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
            const positions = yield this.brokerApi.getAllOpenLeveragePositions();
            const longPosition = _.sumBy(positions.filter(p => p.side === 'buy'), p => p.amount);
            const shortPosition = _.sumBy(positions.filter(p => p.side === 'sell'), p => p.amount);
            return (0, util_1.eRound)(longPosition - shortPosition);
        });
    }
    getBrokerOrderType(order) {
        switch (order.side) {
            case types_1.OrderSide.Buy:
                return 'leverage_buy';
            case types_1.OrderSide.Sell:
                return 'leverage_sell';
            default:
                throw new Error();
        }
    }
}
exports.default = MarginOpenStrategy;
