"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const symbols_1 = require("./symbols");
const Arbitrager_1 = require("./Arbitrager");
const JsonConfigStore_1 = require("./JsonConfigStore");
const QuoteAggregator_1 = require("./QuoteAggregator");
const PositionService_1 = require("./PositionService");
const BrokerAdapterRouter_1 = require("./BrokerAdapterRouter");
const SpreadAnalyzer_1 = require("./SpreadAnalyzer");
const ConfigValidator_1 = require("./ConfigValidator");
const LimitCheckerFactory_1 = require("./LimitCheckerFactory");
const ActivePairLevelStore_1 = require("./ActivePairLevelStore");
const chrono_1 = require("./chrono");
const OpportunitySearcher_1 = require("./OpportunitySearcher");
const PairTrader_1 = require("./PairTrader");
const SingleLegHandler_1 = require("./SingleLegHandler");
const events_1 = require("events");
const SpreadStatTimeSeries_1 = require("./SpreadStatTimeSeries");
const ReportService_1 = require("./ReportService");
const BrokerStabilityTracker_1 = require("./BrokerStabilityTracker");
const awaitable_event_emitter_1 = require("@bitr/awaitable-event-emitter");
const WebGateway_1 = require("./WebGateway");
const HistoricalOrderStore_1 = require("./HistoricalOrderStore");
const OrderService_1 = require("./OrderService");
(0, inversify_1.decorate)((0, inversify_1.injectable)(), events_1.EventEmitter);
(0, inversify_1.decorate)((0, inversify_1.injectable)(), awaitable_event_emitter_1.AwaitableEventEmitter);
const container = new inversify_1.Container();
container.bind(Arbitrager_1.default).toSelf();
container
    .bind(symbols_1.default.ConfigStore)
    .to(JsonConfigStore_1.default)
    .inSingletonScope();
container
    .bind(QuoteAggregator_1.default)
    .toSelf()
    .inSingletonScope();
container
    .bind(PositionService_1.default)
    .toSelf()
    .inSingletonScope();
container
    .bind(BrokerAdapterRouter_1.default)
    .toSelf()
    .inSingletonScope();
container.bind(SpreadAnalyzer_1.default).toSelf();
container
    .bind(ConfigValidator_1.default)
    .toSelf()
    .inSingletonScope();
container
    .bind(LimitCheckerFactory_1.default)
    .toSelf()
    .inSingletonScope();
container
    .bind(OpportunitySearcher_1.default)
    .toSelf()
    .inSingletonScope();
container
    .bind(PairTrader_1.default)
    .toSelf()
    .inSingletonScope();
container
    .bind(SingleLegHandler_1.default)
    .toSelf()
    .inSingletonScope();
container
    .bind(BrokerStabilityTracker_1.default)
    .toSelf()
    .inSingletonScope();
container
    .bind(ReportService_1.default)
    .toSelf()
    .inSingletonScope();
container
    .bind(WebGateway_1.default)
    .toSelf()
    .inSingletonScope();
container.bind(symbols_1.default.ActivePairStore).toConstantValue((0, ActivePairLevelStore_1.getActivePairStore)((0, chrono_1.getChronoDB)()));
container
    .bind(symbols_1.default.SpreadStatTimeSeries)
    .toConstantValue((0, SpreadStatTimeSeries_1.getSpreadStatTimeSeries)((0, chrono_1.getChronoDB)()));
container
    .bind(symbols_1.default.HistoricalOrderStore)
    .toConstantValue((0, HistoricalOrderStore_1.getHistoricalOrderStore)((0, chrono_1.getChronoDB)()));
container
    .bind(OrderService_1.default)
    .toSelf()
    .inSingletonScope();
exports.default = container;
