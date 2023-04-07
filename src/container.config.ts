import { Container, decorate, injectable } from 'inversify';
import symbols from './symbols';
import Arbitrager from './arbitrager';
import { ConfigStore, ActivePairStore, SpreadStatTimeSeries, HistoricalOrderStore } from './types';
import JsonConfigStore from './jsonConfigStore';
import QuoteAggregator from './quoteAggregator';
import PositionService from './positionService';
import BrokerAdapterRouter from './brokerAdapterRouter';
import SpreadAnalyzer from './spreadAnalyzer';
import ConfigValidator from './configValidator';
import LimitCheckerFactory from './limitCheckerFactory';
import { getActivePairStore } from './activePairLevelStore';
import { getChronoDB } from './chrono';
import OppotunitySearcher from './opportunitySearcher';
import PairTrader from './pairTrader';
import SingleLegHandler from './singleLegHandler';
import { EventEmitter } from 'events';
import { getSpreadStatTimeSeries } from './spreadStatTimeSeries';
import ReportService from './reportService';
import BrokerStabilityTracker from './brokerStabilityTracker';
import { AwaitableEventEmitter } from '@bitr/awaitable-event-emitter';
import WebGateway from './webGateway';
import { getHistoricalOrderStore } from './historicalOrderStore';
import OrderService from './orderService';

decorate(injectable(), EventEmitter);
decorate(injectable(), AwaitableEventEmitter);

const container = new Container();
container.bind<Arbitrager>(Arbitrager).toSelf();
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
