"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@bitr/logger");
const _ = require("lodash");
const intl_1 = require("./intl");
const pnl_1 = require("./pnl");
class MainLimitChecker {
    constructor(configStore, positionService, spreadAnalysisResult, orderPair) {
        this.log = (0, logger_1.getLogger)(this.constructor.name);
        if (orderPair) {
            this.limits = [
                new MinExitTargetProfitLimit(configStore, spreadAnalysisResult, orderPair),
                new MaxNetExposureLimit(configStore, positionService),
                new MaxTargetProfitLimit(configStore, spreadAnalysisResult),
                new MaxTargetVolumeLimit(configStore, spreadAnalysisResult),
                new DemoModeLimit(configStore)
            ];
        }
        else {
            this.limits = [
                new MaxNetExposureLimit(configStore, positionService),
                new InvertedSpreadLimit(spreadAnalysisResult),
                new MinTargetProfitLimit(configStore, spreadAnalysisResult),
                new MaxTargetProfitLimit(configStore, spreadAnalysisResult),
                new MaxTargetVolumeLimit(configStore, spreadAnalysisResult),
                new DemoModeLimit(configStore)
            ];
        }
    }
    check() {
        for (const limit of this.limits) {
            const result = limit.check();
            this.log.debug(`${limit.constructor.name} ${result.success ? 'passed' : 'violated'}`);
            if (!result.success) {
                return result;
            }
        }
        return { success: true, reason: '', message: '' };
    }
}
exports.default = MainLimitChecker;
class MinExitTargetProfitLimit {
    constructor(configStore, spreadAnalysisResult, orderPair) {
        this.configStore = configStore;
        this.spreadAnalysisResult = spreadAnalysisResult;
        this.orderPair = orderPair;
        this.log = (0, logger_1.getLogger)(this.constructor.name);
    }
    check() {
        const success = this.isExitProfitLargeEnough();
        if (success) {
            return { success, reason: '', message: '' };
        }
        const reason = 'Too small exit profit';
        const message = (0, intl_1.default) `TargetProfitIsSmallerThanMinProfit`;
        return { success, reason, message };
    }
    isExitProfitLargeEnough() {
        const effectiveValue = this.getEffectiveMinExitTargetProfit();
        this.log.debug(`effectiveMinExitTargetProfit: ${effectiveValue}`);
        return this.spreadAnalysisResult.targetProfit >= effectiveValue;
    }
    getEffectiveMinExitTargetProfit() {
        const pair = this.orderPair;
        const { bid, ask, targetVolume } = this.spreadAnalysisResult;
        const targetVolumeNotional = _.mean([ask.price, bid.price]) * targetVolume;
        const { minExitTargetProfit, minExitTargetProfitPercent, exitNetProfitRatio } = this.configStore.config;
        const openProfit = (0, pnl_1.calcProfit)(pair, this.configStore.config).profit;
        return _.max([
            minExitTargetProfit,
            minExitTargetProfitPercent !== undefined
                ? _.round(minExitTargetProfitPercent / 100 * targetVolumeNotional)
                : Number.MIN_SAFE_INTEGER,
            exitNetProfitRatio !== undefined ? openProfit * (exitNetProfitRatio / 100 - 1) : Number.MIN_SAFE_INTEGER
        ]);
    }
}
class MaxNetExposureLimit {
    constructor(configStore, positionService) {
        this.configStore = configStore;
        this.positionService = positionService;
    }
    check() {
        const success = Math.abs(this.positionService.netExposure) <= this.configStore.config.maxNetExposure;
        if (success) {
            return { success, reason: '', message: '' };
        }
        const reason = 'Max exposure breached';
        const message = (0, intl_1.default) `NetExposureIsLargerThanMaxNetExposure`;
        return { success, reason, message };
    }
}
class InvertedSpreadLimit {
    constructor(spreadAnalysisResult) {
        this.spreadAnalysisResult = spreadAnalysisResult;
    }
    check() {
        const success = this.spreadAnalysisResult.invertedSpread > 0;
        if (success) {
            return { success, reason: '', message: '' };
        }
        const reason = 'Spread not inverted';
        const message = (0, intl_1.default) `NoArbitrageOpportunitySpreadIsNotInverted`;
        return { success, reason, message };
    }
}
class MinTargetProfitLimit {
    constructor(configStore, spreadAnalysisResult) {
        this.configStore = configStore;
        this.spreadAnalysisResult = spreadAnalysisResult;
    }
    check() {
        const success = this.isTargetProfitLargeEnough();
        if (success) {
            return { success, reason: '', message: '' };
        }
        const reason = 'Too small profit';
        const message = (0, intl_1.default) `TargetProfitIsSmallerThanMinProfit`;
        return { success, reason, message };
    }
    isTargetProfitLargeEnough() {
        const config = this.configStore.config;
        const { bid, ask, targetVolume, targetProfit } = this.spreadAnalysisResult;
        const targetVolumeNotional = _.mean([ask.price, bid.price]) * targetVolume;
        const effectiveMinTargetProfit = _.max([
            config.minTargetProfit,
            config.minTargetProfitPercent !== undefined
                ? _.round(config.minTargetProfitPercent / 100 * targetVolumeNotional)
                : 0
        ]);
        return targetProfit >= effectiveMinTargetProfit;
    }
}
class MaxTargetProfitLimit {
    constructor(configStore, spreadAnalysisResult) {
        this.configStore = configStore;
        this.spreadAnalysisResult = spreadAnalysisResult;
    }
    check() {
        const success = this.isProfitSmallerThanLimit();
        if (success) {
            return { success, reason: '', message: '' };
        }
        const reason = 'Too large profit';
        const message = (0, intl_1.default) `TargetProfitIsLargerThanMaxProfit`;
        return { success, reason, message };
    }
    isProfitSmallerThanLimit() {
        const { config } = this.configStore;
        const { bid, ask, targetVolume, targetProfit } = this.spreadAnalysisResult;
        const maxTargetProfit = _.min([
            config.maxTargetProfit,
            config.maxTargetProfitPercent !== undefined
                ? _.round(config.maxTargetProfitPercent / 100 * _.mean([ask.price, bid.price]) * targetVolume)
                : Number.MAX_SAFE_INTEGER
        ]);
        return targetProfit <= maxTargetProfit;
    }
}
class MaxTargetVolumeLimit {
    constructor(configStore, spreadAnalysisResult) {
        this.configStore = configStore;
        this.spreadAnalysisResult = spreadAnalysisResult;
    }
    check() {
        const success = this.isVolumeSmallerThanLimit();
        if (success) {
            return { success, reason: '', message: '' };
        }
        const reason = 'Too large Volume';
        const message = (0, intl_1.default) `TargetVolumeIsLargerThanMaxTargetVolumePercent`;
        return { success, reason, message };
    }
    isVolumeSmallerThanLimit() {
        const { config } = this.configStore;
        const { availableVolume, targetVolume } = this.spreadAnalysisResult;
        const maxTargetVolume = _.min([
            config.maxTargetVolumePercent !== undefined
                ? config.maxTargetVolumePercent / 100 * availableVolume
                : Number.MAX_SAFE_INTEGER
        ]);
        return targetVolume <= maxTargetVolume;
    }
}
class DemoModeLimit {
    constructor(configStore) {
        this.configStore = configStore;
    }
    check() {
        const success = !this.configStore.config.demoMode;
        if (success) {
            return { success, reason: '', message: '' };
        }
        const reason = 'Demo mode';
        const message = (0, intl_1.default) `ThisIsDemoModeNotSendingOrders`;
        return { success, reason, message };
    }
}
