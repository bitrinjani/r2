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
class NetOutStrategy {
    constructor(brokerApi) {
        this.brokerApi = brokerApi;
    }
    send(order) {
        return __awaiter(this, void 0, void 0, function* () {
            if (order.cashMarginType !== types_1.CashMarginType.NetOut) {
                throw new Error();
            }
            const request = yield this.getNetOutRequest(order);
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
    getNetOutRequest(order) {
        return __awaiter(this, void 0, void 0, function* () {
            const openPositions = yield this.brokerApi.getAllOpenLeveragePositions();
            const targetSide = order.side === types_1.OrderSide.Buy ? 'sell' : 'buy';
            const candidates = _(openPositions)
                .filter(p => p.side === targetSide)
                .filter(p => (0, util_1.almostEqual)(p.amount, order.size, 1))
                .value();
            if (order.symbol !== 'BTC/JPY') {
                throw new Error('Not supported');
            }
            const pair = 'btc_jpy';
            const rate = order.type === types_1.OrderType.Market ? undefined : order.price;
            const request = { pair, rate };
            if (candidates.length === 0) {
                return Object.assign(Object.assign({}, request), { order_type: order.side === types_1.OrderSide.Buy ? 'leverage_buy' : 'leverage_sell', amount: order.size });
            }
            const targetPosition = _.last(candidates);
            return Object.assign(Object.assign({}, request), { order_type: order.side === types_1.OrderSide.Buy ? 'close_short' : 'close_long', amount: targetPosition.amount, position_id: Number(targetPosition.id) });
        });
    }
}
exports.default = NetOutStrategy;
