import { Container } from 'inversify';
import symbols from './symbols';
import Arbitrager from './Arbitrager';
import {
  ConfigStore,
  ActivePairStore
} from './types';
import JsonConfigStore from './JsonConfigStore';
import QuoteAggregator from './QuoteAggregator';
import PositionService from './PositionService';
import BrokerAdapterRouter from './BrokerAdapterRouter';
import SpreadAnalyzer from './SpreadAnalyzer';
import ConfigValidator from './ConfigValidator';
import LimitCheckerFactory from './LimitCheckerFactory';
import { getActivePairStore } from './ActivePairLevelStore';
import { getChronoDB } from './chrono';

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
container.bind<BrokerAdapterRouter>(BrokerAdapterRouter).toSelf();
container.bind<SpreadAnalyzer>(SpreadAnalyzer).toSelf();
container.bind<ConfigValidator>(ConfigValidator).toSelf();
container.bind<LimitCheckerFactory>(LimitCheckerFactory).toSelf();
container
  .bind<ActivePairStore>(symbols.ActivePairStore)
  .toConstantValue(getActivePairStore(getChronoDB()));

export default container;
