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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
const inversify_1 = require("inversify");
const _ = require("lodash");
const OrderImpl_1 = require("./OrderImpl");
const types_1 = require("./types");
const intl_1 = require("./intl");
const util_1 = require("./util");
const symbols_1 = require("./symbols");
const SingleLegHandler_1 = require("./SingleLegHandler");
const configUtil_1 = require("./configUtil");
const BrokerAdapterRouter_1 = require("./BrokerAdapterRouter");
const events_1 = require("events");
const pnl_1 = require("./pnl");
const OrderUtil = require("./OrderUtil");
let PairTrader = class PairTrader extends events_1.EventEmitter {
    constructor(configStore, brokerAdapterRouter, activePairStore, singleLegHandler) {
        super();
        this.configStore = configStore;
        this.brokerAdapterRouter = brokerAdapterRouter;
        this.activePairStore = activePairStore;
        this.singleLegHandler = singleLegHandler;
        this.log = (0, logger_1.getLogger)(this.constructor.name);
    }
    set status(value) {
        this.emit('status', value);
    }
    trade(spreadAnalysisResult, closable) {
        return __awaiter(this, void 0, void 0, function* () {
            const { bid, ask, targetVolume } = spreadAnalysisResult;
            const sendTasks = [ask, bid].map(q => this.sendOrder(q, targetVolume, types_1.OrderType.Limit));
            const orders = yield Promise.all(sendTasks);
            this.status = 'Sent';
            yield this.checkOrderState(orders, closable);
        });
    }
    checkOrderState(orders, closable) {
        return __awaiter(this, void 0, void 0, function* () {
            const { config } = this.configStore;
            for (const i of _.range(1, config.maxRetryCount + 1)) {
                yield (0, util_1.delay)(config.orderStatusCheckInterval);
                this.log.info((0, intl_1.default) `OrderCheckAttempt`, i);
                this.log.info((0, intl_1.default) `CheckingIfBothLegsAreDoneOrNot`);
                try {
                    const refreshTasks = orders.map(o => this.brokerAdapterRouter.refresh(o));
                    yield Promise.all(refreshTasks);
                }
                catch (ex) {
                    this.log.warn(ex.message);
                    this.log.debug(ex.stack);
                }
                this.printOrderSummary(orders);
                if (orders.every(o => o.filled)) {
                    this.log.info((0, intl_1.default) `BothLegsAreSuccessfullyFilled`);
                    if (closable) {
                        this.status = 'Closed';
                    }
                    else {
                        this.status = 'Filled';
                        if (orders[0].size === orders[1].size) {
                            this.log.debug(`Putting pair ${JSON.stringify(orders)}.`);
                            yield this.activePairStore.put(orders);
                        }
                    }
                    this.printProfit(orders);
                    break;
                }
                if (i === config.maxRetryCount) {
                    this.status = 'MaxRetryCount breached';
                    this.log.warn((0, intl_1.default) `MaxRetryCountReachedCancellingThePendingOrders`);
                    const cancelTasks = orders.filter(o => !o.filled).map(o => this.brokerAdapterRouter.cancel(o));
                    yield Promise.all(cancelTasks);
                    if (orders.some(o => !o.filled) &&
                        _(orders).sumBy(o => o.filledSize * (o.side === types_1.OrderSide.Buy ? -1 : 1)) !== 0) {
                        const subOrders = yield this.singleLegHandler.handle(orders, closable);
                        if (subOrders.length !== 0 && subOrders.every(o => o.filled)) {
                            this.printProfit(_.concat(orders, subOrders));
                        }
                    }
                    break;
                }
            }
        });
    }
    sendOrder(quote, targetVolume, orderType) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.info((0, intl_1.default) `SendingOrderTargettingQuote`, (0, util_1.formatQuote)(quote));
            const brokerConfig = (0, configUtil_1.findBrokerConfig)(this.configStore.config, quote.broker);
            const { config } = this.configStore;
            const { cashMarginType, leverageLevel } = brokerConfig;
            const orderSide = quote.side === types_1.QuoteSide.Ask ? types_1.OrderSide.Buy : types_1.OrderSide.Sell;
            const orderPrice = (quote.side === types_1.QuoteSide.Ask && config.acceptablePriceRange !== undefined)
                ? _.round(quote.price * (1 + config.acceptablePriceRange / 100))
                : (quote.side === types_1.QuoteSide.Bid && config.acceptablePriceRange !== undefined)
                    ? _.round(quote.price * (1 - config.acceptablePriceRange / 100))
                    : quote.price;
            const order = new OrderImpl_1.default({
                symbol: this.configStore.config.symbol,
                broker: quote.broker,
                side: orderSide,
                size: targetVolume,
                price: orderPrice,
                cashMarginType,
                type: orderType,
                leverageLevel
            });
            yield this.brokerAdapterRouter.send(order);
            return order;
        });
    }
    printOrderSummary(orders) {
        orders.forEach(o => {
            if (o.filled) {
                this.log.info(OrderUtil.toExecSummary(o));
            }
            else {
                this.log.warn(OrderUtil.toExecSummary(o));
            }
        });
    }
    printProfit(orders) {
        const { profit, commission } = (0, pnl_1.calcProfit)(orders, this.configStore.config);
        this.log.info((0, intl_1.default) `ProfitIs`, _.round(profit));
        if (commission !== 0) {
            this.log.info((0, intl_1.default) `CommissionIs`, _.round(commission));
        }
    }
}; /* istanbul ignore next */
PairTrader = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(symbols_1.default.ConfigStore)),
    __param(2, (0, inversify_1.inject)(symbols_1.default.ActivePairStore)),
    __metadata("design:paramtypes", [Object, BrokerAdapterRouter_1.default, Object, SingleLegHandler_1.default])
], PairTrader);
exports.default = PairTrader;
