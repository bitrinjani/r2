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
const logger_1 = require("@bitr/logger");
const _ = require("lodash");
const BrokerApi_1 = require("./BrokerApi");
const util_1 = require("../util");
class BrokerAdapterImpl {
    constructor(config) {
        this.config = config;
        this.log = (0, logger_1.getLogger)('Bitflyer.BrokerAdapter');
        this.broker = 'Bitflyer';
        this.brokerApi = new BrokerApi_1.default(this.config.key, this.config.secret);
    }
    send(order) {
        return __awaiter(this, void 0, void 0, function* () {
            if (order.broker !== this.broker) {
                throw new Error();
            }
            const param = this.mapOrderToSendChildOrderRequest(order);
            const reply = yield this.brokerApi.sendChildOrder(param);
            order.brokerOrderId = reply.child_order_acceptance_id;
            order.status = types_1.OrderStatus.New;
            order.sentTime = new Date();
            order.lastUpdated = new Date();
        });
    }
    refresh(order) {
        return __awaiter(this, void 0, void 0, function* () {
            const orderId = order.brokerOrderId;
            const request = { child_order_acceptance_id: orderId };
            const reply = yield this.brokerApi.getChildOrders(request);
            const childOrder = reply[0];
            if (childOrder === undefined) {
                const message = `Unable to find ${orderId}. GetOrderState failed.`;
                this.log.warn(message);
                return;
            }
            this.setOrderFields(childOrder, order);
            const executions = yield this.brokerApi.getExecutions({ child_order_acceptance_id: orderId });
            order.executions = _.map(executions, x => {
                const e = (0, util_1.toExecution)(order);
                e.size = x.size;
                e.price = x.price;
                e.execTime = new Date(x.exec_date);
                return e;
            });
            order.lastUpdated = new Date();
        });
    }
    cancel(order) {
        return __awaiter(this, void 0, void 0, function* () {
            let productCode = '';
            switch (order.symbol) {
                case 'BTC/JPY':
                    productCode = 'BTC_JPY';
                    break;
                default:
                    throw new Error('Not implemented.');
            }
            const request = { product_code: productCode, child_order_acceptance_id: order.brokerOrderId };
            yield this.brokerApi.cancelChildOrder(request);
            order.lastUpdated = new Date();
            order.status = types_1.OrderStatus.Canceled;
        });
    }
    getBtcPosition() {
        return __awaiter(this, void 0, void 0, function* () {
            const balanceResponse = yield this.brokerApi.getBalance();
            const btcBalance = _.find(balanceResponse, b => b.currency_code === 'BTC');
            if (!btcBalance) {
                throw new Error('Btc balance is not found.');
            }
            return btcBalance.amount;
        });
    }
    fetchQuotes() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.brokerApi.getBoard();
            return this.mapToQuote(response);
        });
    }
    mapOrderToSendChildOrderRequest(order) {
        if (order.cashMarginType !== types_1.CashMarginType.Cash) {
            throw new Error('Not implemented.');
        }
        let productCode = '';
        switch (order.symbol) {
            case 'BTC/JPY':
                productCode = 'BTC_JPY';
                break;
            default:
                throw new Error('Not implemented.');
        }
        let price = 0;
        let childOrderType = '';
        switch (order.type) {
            case types_1.OrderType.Limit:
                childOrderType = 'LIMIT';
                price = order.price;
                break;
            case types_1.OrderType.Market:
                childOrderType = 'MARKET';
                price = 0;
                break;
            default:
                throw new Error('Not implemented.');
        }
        let timeInForce;
        switch (order.timeInForce) {
            case types_1.TimeInForce.None:
                timeInForce = '';
                break;
            case types_1.TimeInForce.Fok:
                timeInForce = 'FOK';
                break;
            case types_1.TimeInForce.Ioc:
                timeInForce = 'IOC';
                break;
            default:
                throw new Error('Not implemented.');
        }
        return {
            price,
            product_code: productCode,
            child_order_type: childOrderType,
            side: types_1.OrderSide[order.side].toUpperCase(),
            size: order.size,
            time_in_force: timeInForce
        };
    }
    setOrderFields(childOrder, order) {
        order.filledSize = (0, util_1.eRound)(childOrder.executed_size);
        if (childOrder.child_order_state === 'CANCELED') {
            order.status = types_1.OrderStatus.Canceled;
        }
        else if (childOrder.child_order_state === 'EXPIRED') {
            order.status = types_1.OrderStatus.Expired;
        }
        else if (order.filledSize === order.size) {
            order.status = types_1.OrderStatus.Filled;
        }
        else if (order.filledSize > 0) {
            order.status = types_1.OrderStatus.PartiallyFilled;
        }
        order.lastUpdated = new Date();
    }
    mapToQuote(boardResponse) {
        const asks = _(boardResponse.asks)
            .take(100)
            .map(q => {
            return { broker: this.broker, side: types_1.QuoteSide.Ask, price: Number(q.price), volume: Number(q.size) };
        })
            .value();
        const bids = _(boardResponse.bids)
            .take(100)
            .map(q => {
            return { broker: this.broker, side: types_1.QuoteSide.Bid, price: Number(q.price), volume: Number(q.size) };
        })
            .value();
        return _.concat(asks, bids);
    }
} /* istanbul ignore next */
exports.default = BrokerAdapterImpl;
