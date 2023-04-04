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
const types_1 = require("./types");
const intl_1 = require("./intl");
const util_1 = require("./util");
const symbols_1 = require("./symbols");
const PositionService_1 = require("./PositionService");
const SpreadAnalyzer_1 = require("./SpreadAnalyzer");
const LimitCheckerFactory_1 = require("./LimitCheckerFactory");
const events_1 = require("events");
const pnl_1 = require("./pnl");
const constants_1 = require("./constants");
const OrderUtil = require("./OrderUtil");
let OppotunitySearcher = class OppotunitySearcher extends events_1.EventEmitter {
    constructor(configStore, positionService, spreadAnalyzer, limitCheckerFactory, activePairStore) {
        super();
        this.configStore = configStore;
        this.positionService = positionService;
        this.spreadAnalyzer = spreadAnalyzer;
        this.limitCheckerFactory = limitCheckerFactory;
        this.activePairStore = activePairStore;
        this.log = (0, logger_1.getLogger)(this.constructor.name);
    }
    set status(value) {
        this.emit('status', value);
    }
    search(quotes) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.info((0, intl_1.default) `LookingForOpportunity`);
            const { closable, key: closablePairKey, exitAnalysisResult } = yield this.findClosable(quotes);
            if (closable) {
                this.log.info((0, intl_1.default) `FoundClosableOrders`);
                const spreadAnalysisResult = exitAnalysisResult;
                this.log.debug(`Deleting key ${closablePairKey}.`);
                yield this.activePairStore.del(closablePairKey);
                return { found: true, spreadAnalysisResult, closable };
            }
            try {
                const spreadAnalysisResult = yield this.spreadAnalyzer.analyze(quotes, this.positionService.positionMap);
                this.printSpreadAnalysisResult(spreadAnalysisResult);
                this.emit('spreadAnalysisDone', spreadAnalysisResult);
                const limitCheckResult = this.limitCheckerFactory.create(spreadAnalysisResult).check();
                if (!limitCheckResult.success) {
                    this.status = limitCheckResult.reason;
                    this.log.info(limitCheckResult.message);
                    this.emit('limitCheckDone', limitCheckResult);
                    return { found: false };
                }
                this.log.info((0, intl_1.default) `FoundArbitrageOppotunity`);
                this.emit('limitCheckDone', Object.assign(Object.assign({}, limitCheckResult), { message: (0, intl_1.default) `FoundArbitrageOppotunity` }));
                return { found: true, spreadAnalysisResult, closable };
            }
            catch (ex) {
                this.status = 'Spread analysis failed';
                this.log.warn((0, intl_1.default) `FailedToGetASpreadAnalysisResult`, ex.message);
                this.log.debug(ex.stack);
                return { found: false };
            }
        });
    }
    findClosable(quotes) {
        return __awaiter(this, void 0, void 0, function* () {
            const { minExitTargetProfit, minExitTargetProfitPercent, exitNetProfitRatio } = this.configStore.config;
            if ([minExitTargetProfit, minExitTargetProfitPercent, exitNetProfitRatio].every(_.isUndefined)) {
                return { closable: false };
            }
            const activePairsMap = yield this.activePairStore.getAll();
            if (activePairsMap.length > 0) {
                this.log.info({ hidden: true }, (0, intl_1.default) `OpenPairs`);
                const pairsWithSummary = yield Promise.all(activePairsMap.map((kv) => __awaiter(this, void 0, void 0, function* () {
                    const { key, value: pair } = kv;
                    try {
                        const exitAnalysisResult = yield this.spreadAnalyzer.analyze(quotes, this.positionService.positionMap, pair);
                        return { key, pair, pairSummary: this.getPairSummary(pair, exitAnalysisResult), exitAnalysisResult };
                    }
                    catch (ex) {
                        this.log.debug(ex.message);
                        return { key, pair, pairSummary: this.getPairSummary(pair) };
                    }
                })));
                this.emit('activePairRefresh', pairsWithSummary);
                pairsWithSummary.forEach(x => this.log.info({ hidden: true }, this.formatPairSummary(x.pair, x.pairSummary)));
                for (const pairWithSummary of pairsWithSummary.filter(x => x.exitAnalysisResult !== undefined)) {
                    const limitChecker = this.limitCheckerFactory.create(pairWithSummary.exitAnalysisResult, pairWithSummary.pair);
                    if (limitChecker.check().success) {
                        return { closable: true, key: pairWithSummary.key, exitAnalysisResult: pairWithSummary.exitAnalysisResult };
                    }
                }
            }
            return { closable: false };
        });
    }
    getPairSummary(pair, exitAnalysisResult) {
        const entryProfit = (0, pnl_1.calcProfit)(pair, this.configStore.config).profit;
        const buyLeg = pair.find(o => o.side === types_1.OrderSide.Buy);
        const sellLeg = pair.find(o => o.side === types_1.OrderSide.Sell);
        const midNotional = _.mean([buyLeg.averageFilledPrice, sellLeg.averageFilledPrice]) * buyLeg.filledSize;
        const entryProfitRatio = _.round(entryProfit / midNotional * 100, constants_1.LOT_MIN_DECIMAL_PLACE);
        let currentExitCost;
        let currentExitCostRatio;
        let currentExitNetProfitRatio;
        if (exitAnalysisResult) {
            currentExitCost = -exitAnalysisResult.targetProfit;
            currentExitCostRatio = _.round(currentExitCost / midNotional * 100, constants_1.LOT_MIN_DECIMAL_PLACE);
            currentExitNetProfitRatio = _.round((entryProfit + exitAnalysisResult.targetProfit) / entryProfit * 100, constants_1.LOT_MIN_DECIMAL_PLACE);
        }
        return {
            entryProfit,
            entryProfitRatio,
            currentExitCost,
            currentExitCostRatio,
            currentExitNetProfitRatio
        };
    }
    formatPairSummary(pair, pairSummary) {
        const { entryProfit, entryProfitRatio, currentExitCost } = pairSummary;
        const entryProfitString = `Entry PL: ${_.round(entryProfit)} JPY (${entryProfitRatio}%)`;
        if (currentExitCost) {
            const currentExitCostText = `Current exit cost: ${_.round(currentExitCost)} JPY`;
            return `[${[
                OrderUtil.toShortString(pair[0]),
                OrderUtil.toShortString(pair[1]),
                entryProfitString,
                currentExitCostText
            ].join(', ')}]`;
        }
        return `[${[OrderUtil.toShortString(pair[0]), OrderUtil.toShortString(pair[1]), entryProfitString].join(', ')}]`;
    }
    printSpreadAnalysisResult(result) {
        const columnWidth = 17;
        this.log.info({ hidden: true }, '%s: %s', (0, util_1.padEnd)((0, intl_1.default) `BestAsk`, columnWidth), (0, util_1.formatQuote)(result.ask));
        this.log.info({ hidden: true }, '%s: %s', (0, util_1.padEnd)((0, intl_1.default) `BestBid`, columnWidth), (0, util_1.formatQuote)(result.bid));
        this.log.info({ hidden: true }, '%s: %s', (0, util_1.padEnd)((0, intl_1.default) `Spread`, columnWidth), -result.invertedSpread);
        this.log.info({ hidden: true }, '%s: %s', (0, util_1.padEnd)((0, intl_1.default) `AvailableVolume`, columnWidth), result.availableVolume);
        this.log.info({ hidden: true }, '%s: %s', (0, util_1.padEnd)((0, intl_1.default) `TargetVolume`, columnWidth), result.targetVolume);
        this.log.info({ hidden: true }, '%s: %s (%s%%)', (0, util_1.padEnd)((0, intl_1.default) `ExpectedProfit`, columnWidth), result.targetProfit, result.profitPercentAgainstNotional);
    }
}; /* istanbul ignore next */
OppotunitySearcher = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(symbols_1.default.ConfigStore)),
    __param(4, (0, inversify_1.inject)(symbols_1.default.ActivePairStore)),
    __metadata("design:paramtypes", [Object, PositionService_1.default,
        SpreadAnalyzer_1.default,
        LimitCheckerFactory_1.default, Object])
], OppotunitySearcher);
exports.default = OppotunitySearcher;
