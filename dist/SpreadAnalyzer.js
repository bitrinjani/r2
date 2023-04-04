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
const inversify_1 = require("inversify");
const types_1 = require("./types");
const logger_1 = require("@bitr/logger");
const _ = require("lodash");
const intl_1 = require("./intl");
const symbols_1 = require("./symbols");
const decimal_js_1 = require("decimal.js");
const configUtil_1 = require("./configUtil");
const constants_1 = require("./constants");
const pnl_1 = require("./pnl");
let SpreadAnalyzer = class SpreadAnalyzer {
    constructor(configStore) {
        this.configStore = configStore;
        this.log = (0, logger_1.getLogger)(this.constructor.name);
    }
    analyze(quotes, positionMap, closingPair) {
        return __awaiter(this, void 0, void 0, function* () {
            if (closingPair && closingPair[0].size !== closingPair[1].size) {
                throw new Error('Invalid closing pair.');
            }
            const { config } = this.configStore;
            if (_.isEmpty(positionMap)) {
                throw new Error('Position map is empty.');
            }
            let filteredQuotes = _(quotes)
                .filter(q => this.isAllowedByCurrentPosition(q, positionMap[q.broker]))
                .filter(q => new decimal_js_1.default(q.volume).gte((closingPair ? closingPair[0].size : config.minSize) *
                _.floor(config.maxTargetVolumePercent !== undefined
                    ? 100 / config.maxTargetVolumePercent
                    : 1)))
                .orderBy(['price'])
                .value();
            if (closingPair) {
                const isOppositeSide = (o, q) => q.side === (o.side === types_1.OrderSide.Buy ? types_1.QuoteSide.Bid : types_1.QuoteSide.Ask);
                const isSameBroker = (o, q) => o.broker === q.broker;
                filteredQuotes = _(filteredQuotes)
                    .filter(q => (isSameBroker(closingPair[0], q) && isOppositeSide(closingPair[0], q)) ||
                    (isSameBroker(closingPair[1], q) && isOppositeSide(closingPair[1], q)))
                    .filter(q => new decimal_js_1.default(q.volume).gte(closingPair[0].size))
                    .value();
            }
            const { ask, bid } = this.getBest(filteredQuotes);
            if (bid === undefined) {
                throw new Error((0, intl_1.default) `NoBestBidWasFound`);
            }
            else if (ask === undefined) {
                throw new Error((0, intl_1.default) `NoBestAskWasFound`);
            }
            const invertedSpread = bid.price - ask.price;
            const availableVolume = _.floor(_.min([bid.volume, ask.volume]), constants_1.LOT_MIN_DECIMAL_PLACE);
            const allowedShortSize = positionMap[bid.broker].allowedShortSize;
            const allowedLongSize = positionMap[ask.broker].allowedLongSize;
            let targetVolume = _.min([availableVolume, config.maxSize, allowedShortSize, allowedLongSize]);
            targetVolume = _.floor(targetVolume, constants_1.LOT_MIN_DECIMAL_PLACE);
            if (closingPair) {
                targetVolume = closingPair[0].size;
            }
            const commission = this.calculateTotalCommission([bid, ask], targetVolume);
            const targetProfit = _.round(invertedSpread * targetVolume - commission);
            const midNotional = _.mean([ask.price, bid.price]) * targetVolume;
            const profitPercentAgainstNotional = _.round(targetProfit / midNotional * 100, constants_1.LOT_MIN_DECIMAL_PLACE);
            const spreadAnalysisResult = {
                bid,
                ask,
                invertedSpread,
                availableVolume,
                targetVolume,
                targetProfit,
                profitPercentAgainstNotional
            };
            this.log.debug(`Analysis done. Result: ${JSON.stringify(spreadAnalysisResult)}`);
            return spreadAnalysisResult;
        });
    }
    getSpreadStat(quotes) {
        return __awaiter(this, void 0, void 0, function* () {
            const { config } = this.configStore;
            const filteredQuotes = _(quotes)
                .filter(q => new decimal_js_1.default(q.volume).gte(config.minSize))
                .orderBy(['price'])
                .value();
            const asks = _(filteredQuotes).filter(q => q.side === types_1.QuoteSide.Ask);
            const bids = _(filteredQuotes).filter(q => q.side === types_1.QuoteSide.Bid);
            if (asks.isEmpty() || bids.isEmpty()) {
                return undefined;
            }
            const byBroker = _(filteredQuotes)
                .groupBy(q => q.broker)
                .mapValues(qs => {
                const { ask, bid } = this.getBest(qs);
                const spread = ask && bid ? ask.price - bid.price : undefined;
                return { ask, bid, spread };
            })
                .value();
            const flattened = _(byBroker)
                .map((v, k) => [v.ask, v.bid])
                .flatten()
                .filter(q => q !== undefined)
                .value();
            const { ask: bestAsk, bid: bestBid } = this.getBest(flattened);
            const { ask: worstAsk, bid: worstBid } = this.getWorst(flattened);
            const bestCase = this.getEstimate(bestAsk, bestBid);
            const worstCase = this.getEstimate(worstAsk, worstBid);
            return {
                timestamp: Date.now(),
                byBroker,
                bestCase,
                worstCase
            };
        });
    }
    getEstimate(ask, bid) {
        const invertedSpread = bid.price - ask.price;
        const availableVolume = _.floor(_.min([bid.volume, ask.volume]), constants_1.LOT_MIN_DECIMAL_PLACE);
        let targetVolume = _.min([availableVolume, this.configStore.config.maxSize]);
        targetVolume = _.floor(targetVolume, constants_1.LOT_MIN_DECIMAL_PLACE);
        const commission = this.calculateTotalCommission([bid, ask], targetVolume);
        const targetProfit = _.round(invertedSpread * targetVolume - commission);
        const midNotional = _.mean([ask.price, bid.price]) * targetVolume;
        const profitPercentAgainstNotional = _.round(targetProfit / midNotional * 100, constants_1.LOT_MIN_DECIMAL_PLACE);
        return {
            ask,
            bid,
            invertedSpread,
            availableVolume,
            targetVolume,
            targetProfit,
            profitPercentAgainstNotional
        };
    }
    getBest(quotes) {
        const ordered = _.orderBy(quotes, ['price']);
        const ask = _(ordered)
            .filter(q => q.side === types_1.QuoteSide.Ask)
            .first();
        const bid = _(ordered)
            .filter(q => q.side === types_1.QuoteSide.Bid)
            .last();
        return { ask, bid };
    }
    getWorst(quotes) {
        const ordered = _.orderBy(quotes, ['price']);
        const ask = _(ordered)
            .filter(q => q.side === types_1.QuoteSide.Ask)
            .last();
        const bid = _(ordered)
            .filter(q => q.side === types_1.QuoteSide.Bid)
            .first();
        return { ask, bid };
    }
    calculateTotalCommission(quotes, targetVolume) {
        return _(quotes).sumBy(q => {
            const brokerConfig = (0, configUtil_1.findBrokerConfig)(this.configStore.config, q.broker);
            return (0, pnl_1.calcCommission)(q.price, targetVolume, brokerConfig.commissionPercent);
        });
    }
    isAllowedByCurrentPosition(q, pos) {
        return q.side === types_1.QuoteSide.Bid ? pos.shortAllowed : pos.longAllowed;
    }
}; /* istanbul ignore next */
SpreadAnalyzer = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(symbols_1.default.ConfigStore)),
    __metadata("design:paramtypes", [Object])
], SpreadAnalyzer);
exports.default = SpreadAnalyzer;
