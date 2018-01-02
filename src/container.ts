import { Container } from 'inversify';
import symbols from './symbols';
import ArbitragerImpl from './ArbitragerImpl';
import {
  Arbitrager,
  ConfigStore,
  QuoteAggregator,
  PositionService,
  BrokerAdapterRouter,
  SpreadAnalyzer,
  ConfigValidator,
  LimitCheckerFactory,
  ActivePairStore
} from './types';
import JsonConfigStore from './JsonConfigStore';
import QuoteAggregatorImpl from './QuoteAggregatorImpl';
import PositionServiceImpl from './PositionServiceImpl';
import BrokerAdapterRouterImpl from './BrokerAdapterRouterImpl';
import SpreadAnalyzerImpl from './SpreadAnalyzerImpl';
import ConfigValidatorImpl from './ConfigValidatorImpl';
import LimitCheckerFactoryImpl from './LimitCheckerFactoryImpl';
import { getActivePairStore } from './ActivePairLevelStore';
import { getChronoDB } from './chrono';

const container = new Container();
container.bind<Arbitrager>(symbols.Arbitrager).to(ArbitragerImpl);
container
  .bind<ConfigStore>(symbols.ConfigStore)
  .to(JsonConfigStore)
  .inSingletonScope();
container
  .bind<QuoteAggregator>(symbols.QuoteAggregator)
  .to(QuoteAggregatorImpl)
  .inSingletonScope();
container
  .bind<PositionService>(symbols.PositionService)
  .to(PositionServiceImpl)
  .inSingletonScope();
container.bind<BrokerAdapterRouter>(symbols.BrokerAdapterRouter).to(BrokerAdapterRouterImpl);
container.bind<SpreadAnalyzer>(symbols.SpreadAnalyzer).to(SpreadAnalyzerImpl);
container.bind<ConfigValidator>(symbols.ConfigValidator).to(ConfigValidatorImpl);
container.bind<LimitCheckerFactory>(symbols.LimitCheckerFactory).to(LimitCheckerFactoryImpl);
container
  .bind<ActivePairStore>(symbols.ActivePairStore)
  .toConstantValue(getActivePairStore(getChronoDB()));

export default container;
