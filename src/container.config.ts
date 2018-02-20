import { Container, decorate, injectable } from 'inversify';
import symbols from './symbols';
import Arbitrager from './Arbitrager';
import { ConfigStore, ActivePairStore, SpreadStatTimeSeries, HistoricalOrderStore } from './types';
import JsonConfigStore from './JsonConfigStore';
import QuoteAggregator from './QuoteAggregator';
import PositionService from './PositionService';
import BrokerAdapterRouter from './BrokerAdapterRouter';
import SpreadAnalyzer from './SpreadAnalyzer';
import ConfigValidator from './ConfigValidator';
import LimitCheckerFactory from './LimitCheckerFactory';
import { getActivePairStore } from './ActivePairLevelStore';
import { getChronoDB } from './chrono';
import OppotunitySearcher from './OpportunitySearcher';
import PairTrader from './PairTrader';
import SingleLegHandler from './SingleLegHandler';
import { EventEmitter } from 'events';
import { getSpreadStatTimeSeries } from './SpreadStatTimeSeries';
import ReportService from './ReportService';
import BrokerStabilityTracker from './BrokerStabilityTracker';
import { AwaitableEventEmitter } from '@bitr/awaitable-event-emitter';
import WebGateway from './WebGateway';
import { getHistoricalOrderStore } from './HistoricalOrderStore';
import OrderService from './OrderService';

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
