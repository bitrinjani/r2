import { Container } from 'inversify';
import symbols from './symbols';
import ArbitragerImpl from './ArbitragerImpl';
import { Arbitrager, ConfigStore, QuoteAggregator, PositionService, 
  BrokerAdapterRouter, SpreadAnalyzer, ConfigValidator, BrokerAdapter, 
  LimitCheckerFactory } from './types';
import JsonConfigStore from './JsonConfigStore';
import QuoteAggregatorImpl from './QuoteAggregatorImpl';
import PositionServiceImpl from './PositionServiceImpl';
import BrokerAdapterRouterImpl from './BrokerAdapterRouterImpl';
import SpreadAnalyzerImpl from './SpreadAnalyzerImpl';
import ConfigValidatorImpl from './ConfigValidatorImpl';
// tslint:disable:import-name
import * as bitflyer from './bitflyer';
import * as coincheck from './coincheck';
import * as quoine from './quoine';
import LimitCheckerFactoryImpl from './LimitCheckerFactoryImpl';

const container = new Container();
container.bind<Arbitrager>(symbols.Arbitrager).to(ArbitragerImpl);
container.bind<ConfigStore>(symbols.ConfigStore).to(JsonConfigStore).inSingletonScope();
container.bind<QuoteAggregator>(symbols.QuoteAggregator).to(QuoteAggregatorImpl).inSingletonScope();
container.bind<PositionService>(symbols.PositionService).to(PositionServiceImpl).inSingletonScope();
container.bind<BrokerAdapterRouter>(symbols.BrokerAdapterRouter).to(BrokerAdapterRouterImpl);
container.bind<SpreadAnalyzer>(symbols.SpreadAnalyzer).to(SpreadAnalyzerImpl);
container.bind<BrokerAdapter>(symbols.BrokerAdapter).to(bitflyer.BrokerAdapterImpl);
container.bind<BrokerAdapter>(symbols.BrokerAdapter).to(coincheck.BrokerAdapterImpl);
container.bind<BrokerAdapter>(symbols.BrokerAdapter).to(quoine.BrokerAdapterImpl);
container.bind<ConfigValidator>(symbols.ConfigValidator).to(ConfigValidatorImpl);
container.bind<LimitCheckerFactory>(symbols.LimitCheckerFactory).to(LimitCheckerFactoryImpl);
export default container;
