import { Container } from 'inversify';
import symbols from './symbols';
import ArbitragerImpl from './ArbitragerImpl';
import { Arbitrager, ConfigStore, QuoteAggregator, PositionService, 
  BrokerAdapterRouter, SpreadAnalyzer, ConfigValidator, BrokerAdapter } from './type';
import JsonConfigStore from './JsonConfigStore';
import QuoteAggregatorImpl from './QuoteAggregatorImpl';
import PositionServiceImpl from './PositionServiceImpl';
import BrokerAdapterRouterImpl from './BrokerAdapterRouterImpl';
import SpreadAnalyzerImpl from './SpreadAnalyzerImpl';
import ConfigValidatorImpl from './ConfigValidatorImpl';
// tslint:disable:import-name
import Bitflyer from './Bitflyer/BrokerAdapterImpl';
import Quoine from './Quoine/BrokerAdapterImpl';
import Coincheck from './Coincheck/BrokerAdapterImpl';

const container = new Container();
container.bind<Arbitrager>(symbols.Arbitrager).to(ArbitragerImpl);
container.bind<ConfigStore>(symbols.ConfigStore).to(JsonConfigStore).inSingletonScope();
container.bind<QuoteAggregator>(symbols.QuoteAggregator).to(QuoteAggregatorImpl).inSingletonScope();
container.bind<PositionService>(symbols.PositionService).to(PositionServiceImpl).inSingletonScope();
container.bind<BrokerAdapterRouter>(symbols.BrokerAdapterRouter).to(BrokerAdapterRouterImpl);
container.bind<SpreadAnalyzer>(symbols.SpreadAnalyzer).to(SpreadAnalyzerImpl);
container.bind<BrokerAdapter>(symbols.BrokerAdapter).to(Bitflyer.BrokerAdapterImpl);
container.bind<BrokerAdapter>(symbols.BrokerAdapter).to(Coincheck.BrokerAdapterImpl);
container.bind<BrokerAdapter>(symbols.BrokerAdapter).to(Quoine.BrokerAdapterImpl);
container.bind<ConfigValidator>(symbols.ConfigValidator).to(ConfigValidatorImpl);
export default container;
