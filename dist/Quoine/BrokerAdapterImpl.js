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
const BrokerApi_1 = require("./BrokerApi");
const _ = require("lodash");
const util_1 = require("../util");
const decimal_js_1 = require("decimal.js");
const CashStrategy_1 = require("./CashStrategy");
const NetOutStrategy_1 = require("./NetOutStrategy");
class BrokerAdapterImpl {
    constructor(config) {
        this.config = config;
        this.broker = 'Quoine';
        this.brokerApi = new BrokerApi_1.default(this.config.key, this.config.secret);
        this.strategyMap = new Map([
            [types_1.CashMarginType.Cash, new CashStrategy_1.default(this.brokerApi)],
            [types_1.CashMarginType.NetOut, new NetOutStrategy_1.default(this.brokerApi)]
        ]);
    }
    send(order) {
        return __awaiter(this, void 0, void 0, function* () {
            if (order.broker !== this.broker) {
                throw new Error();
            }
            const request = this.mapOrderToSendOrderRequest(order);
            const response = yield this.brokerApi.sendOrder(request);
            order.brokerOrderId = response.id.toString();
            order.status = types_1.OrderStatus.New;
            order.sentTime = new Date();
            order.lastUpdated = new Date();
        });
    }
    refresh(order) {
        return __awaiter(this, void 0, void 0, function* () {
            const ordersResponse = yield this.brokerApi.getOrders(order.brokerOrderId);
            this.setOrderFields(ordersResponse, order);
        });
    }
    cancel(order) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.brokerApi.cancelOrder(order.brokerOrderId);
            order.lastUpdated = new Date();
            order.status = types_1.OrderStatus.Canceled;
        });
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
            const response = yield this.brokerApi.getPriceLevels();
            return this.mapToQuote(response);
        });
    }
    mapOrderToSendOrderRequest(order) {
        let productId;
        switch (order.symbol) {
            case 'BTC/JPY':
                productId = '5';
                break;
            default:
                throw new Error('Not implemented.');
        }
        let orderType;
        let price = 0;
        switch (order.type) {
            case types_1.OrderType.Limit:
                orderType = 'limit';
                price = order.price;
                break;
            case types_1.OrderType.Market:
                orderType = 'market';
                price = 0;
                break;
            default:
                throw new Error('Not implemented.');
        }
        let orderDirection;
        let leverageLevel;
        switch (order.cashMarginType) {
            case types_1.CashMarginType.Cash:
                orderDirection = undefined;
                leverageLevel = undefined;
                break;
            case types_1.CashMarginType.NetOut:
                orderDirection = 'netout';
                leverageLevel = order.leverageLevel;
                break;
            default:
                throw new Error('Not implemented.');
        }
        return {
            order: {
                price,
                product_id: productId,
                order_direction: orderDirection,
                order_type: orderType,
                side: types_1.OrderSide[order.side].toLowerCase(),
                quantity: order.size,
                leverage_level: leverageLevel
            }
        };
    }
    setOrderFields(ordersResponse, order) {
        order.brokerOrderId = ordersResponse.id.toString();
        order.filledSize = Number(ordersResponse.filled_quantity);
        order.creationTime = (0, util_1.timestampToDate)(ordersResponse.created_at);
        if (new decimal_js_1.default(order.filledSize).eq(order.size)) {
            order.status = types_1.OrderStatus.Filled;
        }
        else if (order.filledSize > 0) {
            order.status = types_1.OrderStatus.PartiallyFilled;
        }
        order.executions = _.map(ordersResponse.executions, x => {
            const e = (0, util_1.toExecution)(order);
            e.price = Number(x.price);
            e.size = Number(x.quantity);
            e.execTime = (0, util_1.timestampToDate)(x.created_at);
            return e;
        });
        order.lastUpdated = new Date();
    }
    mapToQuote(priceLevelsResponse) {
        const asks = _(priceLevelsResponse.sell_price_levels)
            .take(100)
            .map(q => (0, util_1.toQuote)(this.broker, types_1.QuoteSide.Ask, Number(q[0]), Number(q[1])))
            .value();
        const bids = _(priceLevelsResponse.buy_price_levels)
            .take(100)
            .map(q => (0, util_1.toQuote)(this.broker, types_1.QuoteSide.Bid, Number(q[0]), Number(q[1])))
            .value();
        return _.concat(asks, bids);
    }
} /* istanbul ignore next */
exports.default = BrokerAdapterImpl;
