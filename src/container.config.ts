import type { ConfigStore, ActivePairStore, SpreadStatTimeSeries, HistoricalOrderStore } from "./types";

import { EventEmitter } from "events";

import { AwaitableEventEmitter } from "@bitr/awaitable-event-emitter";
import { Container, decorate, injectable } from "inversify";

import { getActivePairStore } from "./activePairLevelStore";
import Arbitrager from "./arbitrager";
import BrokerAdapterRouter from "./brokerAdapterRouter";
import BrokerStabilityTracker from "./brokerStabilityTracker";
import { getChronoDB } from "./chrono";
import { ConfigValidator } from "./config/validator";
import { JsonConfigStore } from "./config";
import { getHistoricalOrderStore } from "./historicalOrderStore";
import LimitCheckerFactory from "./limitCheckerFactory";
import OppotunitySearcher from "./opportunitySearcher";
import OrderService from "./orderService";
import PairTrader from "./pairTrader";
import PositionService from "./positionService";
import QuoteAggregator from "./quoteAggregator";
import ReportService from "./reportService";
import SingleLegHandler from "./singleLegHandler";
import SpreadAnalyzer from "./spreadAnalyzer";
import { getSpreadStatTimeSeries } from "./spreadStatTimeSeries";
import symbols from "./symbols";
import WebGateway from "./webGateway";

decorate(injectable(), EventEmitter);
decorate(injectable(), AwaitableEventEmitter);

const container = new Container();
container
  .bind<Arbitrager>(Arbitrager)
  .toSelf();
container
  .bind<ConfigStore>(symbols.ConfigStore)
  .to(JsonConfigStore)
  .inSingletonScope();
container
  .bind<QuoteAggregator>(QuoteAggregator)
  .toSelf()
  .inSingletonScope();
container
  .bind<PositionService>(PositionService)
  .toSelf()
  .inSingletonScope();
container
  .bind<BrokerAdapterRouter>(BrokerAdapterRouter)
  .toSelf()
  .inSingletonScope();
container.bind<SpreadAnalyzer>(SpreadAnalyzer).toSelf();
container
  .bind<ConfigValidator>(ConfigValidator)
  .toSelf()
  .inSingletonScope();
container
  .bind<LimitCheckerFactory>(LimitCheckerFactory)
  .toSelf()
  .inSingletonScope();
container
  .bind<OppotunitySearcher>(OppotunitySearcher)
  .toSelf()
  .inSingletonScope();
container
  .bind<PairTrader>(PairTrader)
  .toSelf()
  .inSingletonScope();
container
  .bind<SingleLegHandler>(SingleLegHandler)
  .toSelf()
  .inSingletonScope();
container
  .bind<BrokerStabilityTracker>(BrokerStabilityTracker)
  .toSelf()
  .inSingletonScope();
container
  .bind<ReportService>(ReportService)
  .toSelf()
  .inSingletonScope();
container
  .bind<WebGateway>(WebGateway)
  .toSelf()
  .inSingletonScope();
container.bind<ActivePairStore>(symbols.ActivePairStore).toConstantValue(getActivePairStore(getChronoDB()));
container
  .bind<SpreadStatTimeSeries>(symbols.SpreadStatTimeSeries)
  .toConstantValue(getSpreadStatTimeSeries(getChronoDB()));
container
  .bind<HistoricalOrderStore>(symbols.HistoricalOrderStore)
  .toConstantValue(getHistoricalOrderStore(getChronoDB()));
container
  .bind<OrderService>(OrderService)
  .toSelf()
  .inSingletonScope();

export default container;
