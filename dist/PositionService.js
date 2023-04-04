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
const logger_1 = require("@bitr/logger");
const _ = require("lodash");
const decimal_js_1 = require("decimal.js");
const util_1 = require("./util");
const symbols_1 = require("./symbols");
const BrokerAdapterRouter_1 = require("./BrokerAdapterRouter");
const BrokerStabilityTracker_1 = require("./BrokerStabilityTracker");
const intl_1 = require("./intl");
const events_1 = require("events");
let PositionService = class PositionService extends events_1.EventEmitter {
    constructor(configStore, brokerAdapterRouter, brokerStabilityTracker) {
        super();
        this.configStore = configStore;
        this.brokerAdapterRouter = brokerAdapterRouter;
        this.brokerStabilityTracker = brokerStabilityTracker;
        this.log = (0, logger_1.getLogger)(this.constructor.name);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug('Starting PositionService...');
            this.timer = setInterval(() => this.refresh(), this.configStore.config.positionRefreshInterval);
            yield this.refresh();
            this.log.debug('Started PositionService.');
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug('Stopping PositionService...');
            if (this.timer) {
                clearInterval(this.timer);
            }
            this.log.debug('Stopped PositionService.');
        });
    }
    print() {
        const { baseCcy } = (0, util_1.splitSymbol)(this.configStore.config.symbol);
        const isOk = b => (b ? 'OK' : 'NG');
        const formatBrokerPosition = (brokerPosition) => `${(0, util_1.padEnd)(brokerPosition.broker, 10)}: ${(0, util_1.padStart)(_.round(brokerPosition.baseCcyPosition, 3), 6)} ${baseCcy}, ` +
            `${(0, intl_1.default) `LongAllowed`}: ${isOk(brokerPosition.longAllowed)}, ` +
            `${(0, intl_1.default) `ShortAllowed`}: ${isOk(brokerPosition.shortAllowed)}`;
        this.log.info({ hidden: true }, (0, util_1.hr)(21) + 'POSITION' + (0, util_1.hr)(21));
        this.log.info({ hidden: true }, `Net Exposure: ${_.round(this.netExposure, 3)} ${baseCcy}`);
        _.each(this.positionMap, (position) => {
            const stability = this.brokerStabilityTracker.stability(position.broker);
            this.log.info({ hidden: true }, `${formatBrokerPosition(position)} (Stability: ${stability})`);
        });
        this.log.info({ hidden: true }, (0, util_1.hr)(50));
        this.log.debug(JSON.stringify(this.positionMap));
    }
    get netExposure() {
        return (0, util_1.eRound)(_.sumBy(_.values(this.positionMap), (p) => p.baseCcyPosition));
    }
    get positionMap() {
        return this._positionMap;
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug('Refreshing positions...');
            if (this.isRefreshing) {
                this.log.debug('Already refreshing.');
                return;
            }
            try {
                this.isRefreshing = true;
                const config = this.configStore.config;
                const brokerConfigs = config.brokers.filter(b => b.enabled);
                const promises = brokerConfigs.map(brokerConfig => this.getBrokerPosition(brokerConfig, config.minSize));
                const brokerPositions = yield Promise.all(promises);
                this._positionMap = _(brokerPositions)
                    .map((p) => [p.broker, p])
                    .fromPairs()
                    .value();
                yield this.emit('positionUpdated', this.positionMap);
            }
            catch (ex) {
                this.log.error(ex.message);
                this.log.debug(ex.stack);
            }
            finally {
                this.isRefreshing = false;
                this.log.debug('Finished refresh.');
            }
        });
    }
    getBrokerPosition(brokerConfig, minSize) {
        return __awaiter(this, void 0, void 0, function* () {
            const { baseCcy } = (0, util_1.splitSymbol)(this.configStore.config.symbol);
            const positions = yield this.brokerAdapterRouter.getPositions(brokerConfig.broker);
            const baseCcyPosition = positions.get(baseCcy);
            if (baseCcyPosition === undefined) {
                throw new Error(`Unable to find base ccy position in ${brokerConfig.broker}. ${JSON.stringify([...positions])}`);
            }
            const allowedLongSize = _.max([
                0,
                new decimal_js_1.default(brokerConfig.maxLongPosition).minus(baseCcyPosition).toNumber()
            ]);
            const allowedShortSize = _.max([
                0,
                new decimal_js_1.default(brokerConfig.maxShortPosition).plus(baseCcyPosition).toNumber()
            ]);
            const isStable = this.brokerStabilityTracker.isStable(brokerConfig.broker);
            return {
                broker: brokerConfig.broker,
                baseCcyPosition,
                allowedLongSize,
                allowedShortSize,
                longAllowed: new decimal_js_1.default(allowedLongSize).gte(minSize) && isStable,
                shortAllowed: new decimal_js_1.default(allowedShortSize).gte(minSize) && isStable
            };
        });
    }
}; /* istanbul ignore next */
PositionService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(symbols_1.default.ConfigStore)),
    __metadata("design:paramtypes", [Object, BrokerAdapterRouter_1.default,
        BrokerStabilityTracker_1.default])
], PositionService);
exports.default = PositionService;
