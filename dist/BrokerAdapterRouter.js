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
const _ = require("lodash");
const inversify_1 = require("inversify");
const symbols_1 = require("./symbols");
const BrokerStabilityTracker_1 = require("./BrokerStabilityTracker");
const OrderService_1 = require("./OrderService");
let BrokerAdapterRouter = class BrokerAdapterRouter {
    constructor(brokerAdapters, brokerStabilityTracker, configStore, orderService) {
        this.brokerStabilityTracker = brokerStabilityTracker;
        this.configStore = configStore;
        this.orderService = orderService;
        this.log = (0, logger_1.getLogger)(this.constructor.name);
        this.brokerAdapterMap = _.keyBy(brokerAdapters, x => x.broker);
    }
    send(order) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug(order.toString());
            try {
                yield this.brokerAdapterMap[order.broker].send(order);
                this.orderService.emitOrderUpdated(order);
            }
            catch (ex) {
                this.brokerStabilityTracker.decrement(order.broker);
                throw ex;
            }
        });
    }
    cancel(order) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug(order.toString());
            yield this.brokerAdapterMap[order.broker].cancel(order);
            this.orderService.emitOrderUpdated(order);
        });
    }
    refresh(order) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug(order.toString());
            yield this.brokerAdapterMap[order.broker].refresh(order);
            this.orderService.emitOrderUpdated(order);
        });
    }
    getPositions(broker) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // for backword compatibility, use getBtcPosition if getPositions is not defined
                if (!_.isFunction(this.brokerAdapterMap[broker].getPositions) && this.configStore.config.symbol === 'BTC/JPY') {
                    const btcPosition = yield this.brokerAdapterMap[broker].getBtcPosition();
                    return new Map([['BTC', btcPosition]]);
                }
                if (this.brokerAdapterMap[broker].getPositions !== undefined) {
                    return yield this.brokerAdapterMap[broker].getPositions();
                }
                throw new Error('Unable to find a method to get positions.');
            }
            catch (ex) {
                this.brokerStabilityTracker.decrement(broker);
                throw ex;
            }
        });
    }
    fetchQuotes(broker) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.brokerAdapterMap[broker].fetchQuotes();
            }
            catch (ex) {
                this.brokerStabilityTracker.decrement(broker);
                this.log.error(ex.message);
                this.log.debug(ex.stack);
                return [];
            }
        });
    }
}; /* istanbul ignore next */
BrokerAdapterRouter = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.multiInject)(symbols_1.default.BrokerAdapter)),
    __param(2, (0, inversify_1.inject)(symbols_1.default.ConfigStore)),
    __metadata("design:paramtypes", [Array, BrokerStabilityTracker_1.default, Object, OrderService_1.default])
], BrokerAdapterRouter);
exports.default = BrokerAdapterRouter;
