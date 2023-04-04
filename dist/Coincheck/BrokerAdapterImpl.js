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
const logger_1 = require("@bitr/logger");
const date_fns_1 = require("date-fns");
const _ = require("lodash");
const BrokerApi_1 = require("./BrokerApi");
const types_1 = require("../types");
const util_1 = require("../util");
const CashStrategy_1 = require("./CashStrategy");
const MarginOpenStrategy_1 = require("./MarginOpenStrategy");
const NetOutStrategy_1 = require("./NetOutStrategy");
class BrokerAdapterImpl {
    constructor(config) {
        this.config = config;
        this.log = (0, logger_1.getLogger)('Coincheck.BrokerAdapter');
        this.broker = 'Coincheck';
        this.brokerApi = new BrokerApi_1.default(this.config.key, this.config.secret);
        this.strategyMap = new Map([
            [types_1.CashMarginType.Cash, new CashStrategy_1.default(this.brokerApi)],
            [types_1.CashMarginType.MarginOpen, new MarginOpenStrategy_1.default(this.brokerApi)],
            [types_1.CashMarginType.NetOut, new NetOutStrategy_1.default(this.brokerApi)]
        ]);
    }
    getBtcPosition() {
        return __awaiter(this, void 0, void 0, function* () {
            const strategy = this.strategyMap.get(this.config.cashMarginType);
            if (strategy === undefined) {
                throw new Error(`Unable to find a strategy for ${this.config.cashMarginType}.`);
            }
            return yield strategy.getBtcPosition();
        });
    }
    fetchQuotes() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.brokerApi.getOrderBooks();
            return this.mapToQuote(response);
        });
    }
    mapToQuote(orderBooksResponse) {
        const asks = _(orderBooksResponse.asks)
            .take(100)
            .map(q => (0, util_1.toQuote)(this.broker, types_1.QuoteSide.Ask, q[0], q[1]))
            .value();
        const bids = _(orderBooksResponse.bids)
            .take(100)
            .map(q => (0, util_1.toQuote)(this.broker, types_1.QuoteSide.Bid, q[0], q[1]))
            .value();
        return _.concat(asks, bids);
    }
    send(order) {
        return __awaiter(this, void 0, void 0, function* () {
            if (order.broker !== this.broker) {
                throw new Error();
            }
            const strategy = this.strategyMap.get(order.cashMarginType);
            if (strategy === undefined) {
                throw new Error(`Unable to find a strategy for ${order.cashMarginType}.`);
            }
            yield strategy.send(order);
        });
    }
    cancel(order) {
        return __awaiter(this, void 0, void 0, function* () {
            const orderId = order.brokerOrderId;
            const reply = yield this.brokerApi.cancelOrder(orderId);
            if (!reply.success) {
                throw new Error(`Cancel ${orderId} failed.`);
            }
            order.lastUpdated = new Date();
            order.status = types_1.OrderStatus.Canceled;
        });
    }
    refresh(order) {
        return __awaiter(this, void 0, void 0, function* () {
            const reply = yield this.brokerApi.getOpenOrders();
            const brokerOrder = _.find(reply.orders, o => o.id === order.brokerOrderId);
            if (brokerOrder !== undefined) {
                if (brokerOrder.pending_amount === undefined || brokerOrder.pending_amount === 0) {
                    throw new Error('Unexpected reply returned.');
                }
                order.filledSize = (0, util_1.eRound)(order.size - brokerOrder.pending_amount);
                if (order.filledSize > 0) {
                    order.status = types_1.OrderStatus.PartiallyFilled;
                }
                order.lastUpdated = new Date();
                return;
            }
            const from = (0, date_fns_1.addMinutes)(order.creationTime, -1);
            const transactions = (yield this.brokerApi.getTransactionsWithStartDate(from)).filter(x => x.order_id === order.brokerOrderId);
            if (transactions.length === 0) {
                this.log.warn('The order is not found in pending orders and historical orders.');
                return;
            }
            order.executions = transactions.map(x => {
                const execution = (0, util_1.toExecution)(order);
                execution.execTime = x.created_at;
                execution.price = x.rate;
                execution.size = Math.abs(x.funds.btc);
                return execution;
            });
            order.filledSize = (0, util_1.eRound)(_.sumBy(order.executions, x => x.size));
            order.status = (0, util_1.almostEqual)(order.filledSize, order.size, 1) ? types_1.OrderStatus.Filled : types_1.OrderStatus.Canceled;
            order.lastUpdated = new Date();
        });
    }
} /* istanbul ignore next */
exports.default = BrokerAdapterImpl;
