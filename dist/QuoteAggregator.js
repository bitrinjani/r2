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
const symbols_1 = require("./symbols");
const BrokerAdapterRouter_1 = require("./BrokerAdapterRouter");
const luxon_1 = require("luxon");
const awaitable_event_emitter_1 = require("@bitr/awaitable-event-emitter");
let QuoteAggregator = class QuoteAggregator extends awaitable_event_emitter_1.AwaitableEventEmitter {
    constructor(configStore, brokerAdapterRouter) {
        super();
        this.configStore = configStore;
        this.brokerAdapterRouter = brokerAdapterRouter;
        this.log = (0, logger_1.getLogger)(this.constructor.name);
        this.quotes = [];
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug('Starting Quote Aggregator...');
            const { iterationInterval } = this.configStore.config;
            this.timer = setInterval(this.aggregate.bind(this), iterationInterval);
            this.log.debug(`Iteration interval is set to ${iterationInterval}`);
            yield this.aggregate();
            this.log.debug('Started Quote Aggregator.');
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug('Stopping Quote Aggregator...');
            if (this.timer) {
                clearInterval(this.timer);
            }
            this.log.debug('Stopped Quote Aggregator.');
        });
    }
    aggregate() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRunning) {
                this.log.debug('Aggregator is already running. Skipped iteration.');
                return;
            }
            try {
                this.isRunning = true;
                this.log.debug('Aggregating quotes...');
                const enabledBrokers = this.getEnabledBrokers();
                const fetchTasks = enabledBrokers.map(x => this.brokerAdapterRouter.fetchQuotes(x));
                const quotesMap = yield Promise.all(fetchTasks);
                const allQuotes = _.flatten(quotesMap);
                yield this.setQuotes(this.fold(allQuotes, this.configStore.config.priceMergeSize));
                this.log.debug('Aggregated.');
            }
            catch (ex) {
                this.log.error(ex.message);
                this.log.debug(ex.stack);
            }
            finally {
                this.isRunning = false;
            }
        });
    }
    setQuotes(value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.quotes = value;
            this.log.debug('New quotes have been set.');
            this.log.debug('Calling onQuoteUpdated...');
            yield this.emitParallel('quoteUpdated', this.quotes);
            this.log.debug('onQuoteUpdated done.');
        });
    }
    getEnabledBrokers() {
        return _(this.configStore.config.brokers)
            .filter(b => b.enabled)
            .filter(b => this.timeFilter(b))
            .map(b => b.broker)
            .value();
    }
    timeFilter(brokerConfig) {
        if (_.isEmpty(brokerConfig.noTradePeriods)) {
            return true;
        }
        const current = luxon_1.DateTime.local();
        const outOfPeriod = period => {
            const interval = luxon_1.Interval.fromISO(`${period[0]}/${period[1]}`);
            if (!interval.isValid) {
                this.log.warn('Invalid noTradePeriods. Ignoring the config.');
                return true;
            }
            return !interval.contains(current);
        };
        return brokerConfig.noTradePeriods.every(outOfPeriod);
    }
    fold(quotes, step) {
        return _(quotes)
            .groupBy((q) => {
            const price = q.side === types_1.QuoteSide.Ask ? _.ceil(q.price / step) * step : _.floor(q.price / step) * step;
            return _.join([price, q.broker, types_1.QuoteSide[q.side]], '#');
        })
            .map((value, key) => ({
            broker: value[0].broker,
            side: value[0].side,
            price: Number(key.substring(0, key.indexOf('#'))),
            volume: _.sumBy(value, q => q.volume)
        }))
            .value();
    }
}; /* istanbul ignore next */
QuoteAggregator = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(symbols_1.default.ConfigStore)),
    __metadata("design:paramtypes", [Object, BrokerAdapterRouter_1.default])
], QuoteAggregator);
exports.default = QuoteAggregator;
