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
const types_1 = require("./types");
const constants_1 = require("./constants");
const OrderImpl_1 = require("./OrderImpl");
const _ = require("lodash");
const logger_1 = require("@bitr/logger");
const intl_1 = require("./intl");
const util_1 = require("./util");
const BrokerAdapterRouter_1 = require("./BrokerAdapterRouter");
const inversify_1 = require("inversify");
const symbols_1 = require("./symbols");
const OrderUtil = require("./OrderUtil");
let SingleLegHandler = class SingleLegHandler {
    constructor(brokerAdapterRouter, configStore) {
        this.brokerAdapterRouter = brokerAdapterRouter;
        this.log = (0, logger_1.getLogger)(this.constructor.name);
        this.onSingleLegConfig = configStore.config.onSingleLeg;
        this.symbol = configStore.config.symbol;
    }
    handle(orders, closable) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.onSingleLegConfig === undefined) {
                return [];
            }
            const action = closable ? this.onSingleLegConfig.actionOnExit : this.onSingleLegConfig.action;
            if (action === undefined || action === 'Cancel') {
                return [];
            }
            const { options } = this.onSingleLegConfig;
            switch (action) {
                case 'Reverse':
                    return yield this.reverseLeg(orders, options);
                case 'Proceed':
                    return yield this.proceedLeg(orders, options);
                default:
                    throw new Error('Invalid action.');
            }
        });
    }
    reverseLeg(orders, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const smallLeg = orders[0].filledSize <= orders[1].filledSize ? orders[0] : orders[1];
            const largeLeg = orders[0].filledSize <= orders[1].filledSize ? orders[1] : orders[0];
            const sign = largeLeg.side === types_1.OrderSide.Buy ? -1 : 1;
            const price = _.round(largeLeg.price * (1 + sign * options.limitMovePercent / 100));
            const size = _.floor(largeLeg.filledSize - smallLeg.filledSize, constants_1.LOT_MIN_DECIMAL_PLACE);
            const { baseCcy } = (0, util_1.splitSymbol)(this.symbol);
            this.log.info((0, intl_1.default) `ReverseFilledLeg`, OrderUtil.toShortString(largeLeg), price.toLocaleString(), size, baseCcy);
            const reversalOrder = new OrderImpl_1.default({
                symbol: this.symbol,
                broker: largeLeg.broker,
                side: largeLeg.side === types_1.OrderSide.Buy ? types_1.OrderSide.Sell : types_1.OrderSide.Buy,
                size,
                price,
                cashMarginType: largeLeg.cashMarginType,
                type: types_1.OrderType.Limit,
                leverageLevel: largeLeg.leverageLevel
            });
            yield this.sendOrderWithTtl(reversalOrder, options.ttl);
            return [reversalOrder];
        });
    }
    proceedLeg(orders, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const smallLeg = orders[0].filledSize <= orders[1].filledSize ? orders[0] : orders[1];
            const largeLeg = orders[0].filledSize <= orders[1].filledSize ? orders[1] : orders[0];
            const sign = smallLeg.side === types_1.OrderSide.Buy ? 1 : -1;
            const price = _.round(smallLeg.price * (1 + sign * options.limitMovePercent / 100));
            const size = _.floor(smallLeg.pendingSize - largeLeg.pendingSize, constants_1.LOT_MIN_DECIMAL_PLACE);
            const { baseCcy } = (0, util_1.splitSymbol)(this.symbol);
            this.log.info((0, intl_1.default) `ExecuteUnfilledLeg`, OrderUtil.toShortString(smallLeg), price.toLocaleString(), size, baseCcy);
            const proceedOrder = new OrderImpl_1.default({
                symbol: this.symbol,
                broker: smallLeg.broker,
                side: smallLeg.side,
                size,
                price,
                cashMarginType: smallLeg.cashMarginType,
                type: types_1.OrderType.Limit,
                leverageLevel: smallLeg.leverageLevel
            });
            yield this.sendOrderWithTtl(proceedOrder, options.ttl);
            return [proceedOrder];
        });
    }
    sendOrderWithTtl(order, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.log.info((0, intl_1.default) `SendingOrderTtl`, ttl);
                yield this.brokerAdapterRouter.send(order);
                yield (0, util_1.delay)(ttl);
                yield this.brokerAdapterRouter.refresh(order);
                if (order.filled) {
                    this.log.info(`${OrderUtil.toExecSummary(order)}`);
                }
                else {
                    this.log.info((0, intl_1.default) `NotFilledTtl`, ttl);
                    yield this.brokerAdapterRouter.cancel(order);
                }
            }
            catch (ex) {
                this.log.warn(ex.message);
            }
        });
    }
}; /* istanbul ignore next */
SingleLegHandler = __decorate([
    (0, inversify_1.injectable)(),
    __param(1, (0, inversify_1.inject)(symbols_1.default.ConfigStore)),
    __metadata("design:paramtypes", [BrokerAdapterRouter_1.default, Object])
], SingleLegHandler);
exports.default = SingleLegHandler;
