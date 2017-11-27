import { injectable, inject } from 'inversify';
import {
  PositionService, BrokerAdapterRouter,
  ConfigStore, BrokerConfig, BrokerMap
} from './type';
import { getLogger } from './logger';
import * as _ from 'lodash';
// tslint:disable-next-line:import-name
import Decimal from 'decimal.js';
import BrokerPosition from './BrokerPosition';
import { hr, eRound } from './util';
import symbols from './symbols';

@injectable()
export default class PositionServiceImpl implements PositionService {
  private log = getLogger('PositionService');
  private timer;
  private isRefreshing: boolean;
  private _positionMap: BrokerMap<BrokerPosition>;

  constructor(
    @inject(symbols.ConfigStore) readonly configStore: ConfigStore,
    @inject(symbols.BrokerAdapterRouter) readonly brokerAdapterRouter: BrokerAdapterRouter
  ) { }

  async start(): Promise<void> {
    this.log.debug('Starting PositionService...');
    this.timer = setInterval(() => this.refresh(), this.configStore.config.positionRefreshInterval);
    await this.refresh();
    this.log.debug('Started PositionService.');
    this.isStarted = true;
  }

  async stop(): Promise<void> {
    this.log.debug('Stopping PositionService...');
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.log.debug('Stopped PositionService.');
  }

  print(): void {
    if (!this.isStarted) { return; }
    this.log.info(hr(21) + 'POSITION' + hr(21));
    this.log.info(`Net Exposure: ${_.round(this.netExposure, 3)} BTC`);
    _.each(this.positionMap, (position: BrokerPosition) =>
      this.log.info(position)
    );
    this.log.info(hr(50));
    this.log.debug(JSON.stringify(this.positionMap));
  }

  isStarted: boolean = false;

  get netExposure() {
    return eRound(_.sumBy(_.values(this.positionMap), (p: BrokerPosition) => p.btc));
  }

  get positionMap() {
    return this._positionMap;
  }

  private async refresh(): Promise<void> {
    this.log.debug('Refreshing positions...');
    if (this.isRefreshing) {
      this.log.debug('Already refreshing.');
      return;
    }
    try {
      this.isRefreshing = true;
      const config = this.configStore.config;
      const brokerConfigs = config.brokers.filter(b => b.enabled);
      const promises = brokerConfigs
        .map(async (brokerConfig: BrokerConfig): Promise<BrokerPosition> => {
          const currentBtc = await this.brokerAdapterRouter.getBtcPosition(brokerConfig.broker);
          const allowedLongSize = 
            _.max([0, new Decimal(brokerConfig.maxLongPosition).minus(currentBtc).toNumber()]) as number;
          const allowedShortSize = 
            _.max([0, new Decimal(brokerConfig.maxShortPosition).plus(currentBtc).toNumber()]) as number;
          const pos = new BrokerPosition();
          pos.broker = brokerConfig.broker;
          pos.btc = currentBtc;
          pos.allowedLongSize = allowedLongSize;
          pos.allowedShortSize = allowedShortSize;   
          pos.longAllowed = new Decimal(allowedLongSize).gte(config.minSize);
          pos.shortAllowed = new Decimal(allowedShortSize).gte(config.minSize);
          return pos;
        });
      this._positionMap = _(await Promise.all(promises)).map(p => [p.broker, p]).fromPairs().value();
    } catch (ex) {
      this.log.error(ex.message);
      this.log.debug(ex.stack);
    } finally {
      this.isRefreshing = false;
      this.log.debug('Finished refresh.');
    }
  }
}