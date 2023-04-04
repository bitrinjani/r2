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
const intl_1 = require("./intl");
const util_1 = require("./util");
const symbols_1 = require("./symbols");
const constants_1 = require("./constants");
const QuoteAggregator_1 = require("./QuoteAggregator");
const PositionService_1 = require("./PositionService");
const OpportunitySearcher_1 = require("./OpportunitySearcher");
const PairTrader_1 = require("./PairTrader");
let Arbitrager = class Arbitrager {
    constructor(quoteAggregator, configStore, positionService, opportunitySearcher, pairTrader) {
        this.quoteAggregator = quoteAggregator;
        this.configStore = configStore;
        this.positionService = positionService;
        this.opportunitySearcher = opportunitySearcher;
        this.pairTrader = pairTrader;
        this.log = (0, logger_1.getLogger)(this.constructor.name);
        this.shouldStop = false;
        this.status = 'Init';
        this.opportunitySearcher.on('status', x => (this.status = x));
        this.pairTrader.on('status', x => (this.status = x));
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.status = 'Starting';
            this.log.info((0, intl_1.default) `StartingArbitrager`);
            this.handlerRef = this.quoteUpdated.bind(this);
            this.quoteAggregator.on('quoteUpdated', this.handlerRef);
            this.status = 'Started';
            this.log.info((0, intl_1.default) `StartedArbitrager`);
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.status = 'Stopping';
            this.log.info('Stopping Arbitrager...');
            this.quoteAggregator.removeListener('quoteUpdated', this.handlerRef);
            this.log.info('Stopped Arbitrager.');
            this.status = 'Stopped';
            this.shouldStop = true;
        });
    }
    quoteUpdated(quotes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.shouldStop) {
                yield this.stop();
                return;
            }
            this.positionService.print();
            this.log.info({ hidden: true }, (0, util_1.hr)(20) + 'ARBITRAGER' + (0, util_1.hr)(20));
            yield this.arbitrage(quotes);
            this.log.info({ hidden: true }, (0, util_1.hr)(50));
        });
    }
    arbitrage(quotes) {
        return __awaiter(this, void 0, void 0, function* () {
            this.status = 'Arbitraging';
            const searchResult = yield this.opportunitySearcher.search(quotes);
            if (!searchResult.found) {
                return;
            }
            try {
                yield this.pairTrader.trade(searchResult.spreadAnalysisResult, searchResult.closable);
            }
            catch (ex) {
                this.status = 'Order send/refresh failed';
                this.log.error(ex.message);
                this.log.debug(ex.stack);
                if (_.some(constants_1.fatalErrors, keyword => _.includes(ex.message, keyword))) {
                    this.shouldStop = true;
                }
            }
            this.log.info((0, intl_1.default) `SleepingAfterSend`, this.configStore.config.sleepAfterSend);
            yield (0, util_1.delay)(this.configStore.config.sleepAfterSend);
        });
    }
}; /* istanbul ignore next */
Arbitrager = __decorate([
    (0, inversify_1.injectable)(),
    __param(1, (0, inversify_1.inject)(symbols_1.default.ConfigStore)),
    __metadata("design:paramtypes", [QuoteAggregator_1.default, Object, PositionService_1.default,
        OpportunitySearcher_1.default,
        PairTrader_1.default])
], Arbitrager);
exports.default = Arbitrager;
