"use strict";
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
const intl_1 = require("./intl");
require("reflect-metadata");
const symbols_1 = require("./symbols");
const chrono_1 = require("./chrono");
const QuoteAggregator_1 = require("./QuoteAggregator");
const PositionService_1 = require("./PositionService");
const Arbitrager_1 = require("./Arbitrager");
const ReportService_1 = require("./ReportService");
const BrokerStabilityTracker_1 = require("./BrokerStabilityTracker");
const WebGateway_1 = require("./WebGateway");
class AppRoot {
    constructor(ioc) {
        this.ioc = ioc;
        this.log = (0, logger_1.getLogger)(this.constructor.name);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.log.info((0, intl_1.default) `StartingTheService`);
                yield this.bindBrokers();
                this.services = [
                    this.ioc.get(QuoteAggregator_1.default),
                    this.ioc.get(PositionService_1.default),
                    this.ioc.get(Arbitrager_1.default),
                    this.ioc.get(ReportService_1.default),
                    this.ioc.get(BrokerStabilityTracker_1.default),
                    this.ioc.get(WebGateway_1.default)
                ];
                for (const service of this.services) {
                    yield service.start();
                }
                this.log.info((0, intl_1.default) `SuccessfullyStartedTheService`);
            }
            catch (ex) {
                this.log.error(ex.message);
                this.log.debug(ex.stack);
            }
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.log.info((0, intl_1.default) `StoppingTheService`);
                for (const service of this.services.slice().reverse()) {
                    yield service.stop();
                }
                yield (0, chrono_1.closeChronoDB)();
                this.log.info((0, intl_1.default) `SuccessfullyStoppedTheService`);
            }
            catch (ex) {
                this.log.error(ex.message);
                this.log.debug(ex.stack);
            }
        });
    }
    bindBrokers() {
        return __awaiter(this, void 0, void 0, function* () {
            const configStore = this.ioc.get(symbols_1.default.ConfigStore);
            const brokerConfigs = configStore.config.brokers;
            const bindTasks = brokerConfigs.map((brokerConfig) => __awaiter(this, void 0, void 0, function* () {
                const brokerName = brokerConfig.broker;
                const brokerModule = brokerConfig.npmPath
                    ? yield this.tryImport(brokerConfig.npmPath)
                    : (yield this.tryImport(`./${brokerName}`)) || (yield this.tryImport(`@bitr/${brokerName}`));
                if (brokerModule === undefined) {
                    throw new Error(`Unable to find ${brokerName} package.`);
                }
                const brokerAdapter = brokerModule.create(brokerConfig);
                this.ioc.bind(symbols_1.default.BrokerAdapter).toConstantValue(brokerAdapter);
            }));
            yield Promise.all(bindTasks);
        });
    }
    tryImport(path) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const module = yield Promise.resolve(`${path}`).then(s => require(s));
                if (module.create === undefined) {
                    return undefined;
                }
                return module;
            }
            catch (ex) {
                return undefined;
            }
        });
    }
}
exports.default = AppRoot;
