"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const intl_1 = require("./intl");
const _ = require("lodash");
const inversify_1 = require("inversify");
const configUtil_1 = require("./configUtil");
let ConfigValidator = class ConfigValidator {
    validate(config) {
        const enabledBrokers = config.brokers.filter(b => b.enabled);
        this.throwIf(enabledBrokers.length < 2, (0, intl_1.default) `AtLeastTwoBrokersMustBeEnabled`);
        this.mustBePositive(config.iterationInterval, 'iterationInterval');
        this.mustBePositive(config.maxNetExposure, 'maxNetExposure');
        this.mustBePositive(config.maxRetryCount, 'maxRetryCount');
        this.mustBeGreaterThanZero(config.maxSize, 'maxSize');
        this.mustBeGreaterThanZero(config.minSize, 'minSize');
        this.mustBeGreaterThanZero(config.minTargetProfit, 'minTargetProfit');
        this.mustBePositive(config.orderStatusCheckInterval, 'orderStatusCheckInterval');
        this.mustBePositive(config.positionRefreshInterval, 'positionRefreshInterval');
        this.mustBePositive(config.priceMergeSize, 'priceMergeSize');
        this.mustBePositive(config.sleepAfterSend, 'sleepAfterSend');
        const bitflyer = (0, configUtil_1.findBrokerConfig)(config, 'Bitflyer');
        if (this.isEnabled(bitflyer)) {
            this.throwIf(bitflyer.cashMarginType !== types_1.CashMarginType.Cash, 'CashMarginType must be Cash for Bitflyer.');
            this.validateBrokerConfigCommon(bitflyer);
        }
        const coincheck = (0, configUtil_1.findBrokerConfig)(config, 'Coincheck');
        if (this.isEnabled(coincheck)) {
            const allowedCashMarginType = [types_1.CashMarginType.Cash, types_1.CashMarginType.MarginOpen, types_1.CashMarginType.NetOut];
            this.throwIf(!_.includes(allowedCashMarginType, coincheck.cashMarginType), 'CashMarginType must be Cash, NetOut or MarginOpen for Coincheck.');
            this.validateBrokerConfigCommon(coincheck);
        }
        const quoine = (0, configUtil_1.findBrokerConfig)(config, 'Quoine');
        if (this.isEnabled(quoine)) {
            const allowedCashMarginType = [types_1.CashMarginType.Cash, types_1.CashMarginType.NetOut];
            this.throwIf(!_.includes(allowedCashMarginType, quoine.cashMarginType), 'CashMarginType must be Cash or NetOut for Quoine.');
            this.validateBrokerConfigCommon(quoine);
        }
    }
    mustBePositive(n, name) {
        this.throwIf(n <= 0, `${name} must be positive.`);
    }
    mustBeGreaterThanZero(n, name) {
        this.throwIf(n < 0, `${name} must be zero or positive.`);
    }
    validateBrokerConfigCommon(brokerConfig) {
        this.mustBeGreaterThanZero(brokerConfig.maxLongPosition, 'maxLongPosition');
        this.mustBeGreaterThanZero(brokerConfig.maxShortPosition, 'maxShortPosition');
    }
    isEnabled(brokerConfig) {
        return brokerConfig !== undefined && brokerConfig.enabled;
    }
    throwIf(condition, message) {
        if (condition) {
            throw new Error(message);
        }
    }
};
ConfigValidator = __decorate([
    (0, inversify_1.injectable)()
], ConfigValidator);
exports.default = ConfigValidator;
