import { injectable, inject } from 'inversify';
import {
  PositionService, BrokerAdapterRouter,
  ConfigStore, BrokerConfig, BrokerMap
} from './types';
import { getLogger } from './logger';
import * as _ from 'lodash';
import Decimal from 'decimal.js';
import BrokerPosition from './BrokerPosition';
import { hr, eRound } from './util';
import symbols from './symbols';

@injectable()
export default class PositionServiceImpl implements PositionService {
  private readonly log = getLogger(this.constructor.name);
  private timer;
  private isRefreshing: boolean;
  private _positionMap: BrokerMap<BrokerPosition>;

  constructor(
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    @inject(symbols.BrokerAdapterRouter) private readonly brokerAdapterRouter: BrokerAdapterRouter
  ) { }

  async start(): Promise<void> {
    this.log.debug('Starting PositionService...');
    this.timer = setInterval(() => this.refresh(), this.configStore.config.positionRefreshInterval);
    await this.refresh();
    this.log.debug('Started PositionService.');
  }

  async stop(): Promise<void> {
    this.log.debug('Stopping PositionService...');
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.log.debug('Stopped PositionService.');
  }

  print(): void {
    this.log.info(hr(21) + 'POSITION' + hr(21));
    this.log.info(`Net Exposure: ${_.round(this.netExposure, 3)} BTC`);
    _.each(this.positionMap, (position: BrokerPosition) =>
      this.log.info(position.toString())
    );
    this.log.info(hr(50));
    this.log.debug(JSON.stringify(this.positionMap));
  }

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
      const promises = brokerConfigs.map(brokerConfig => this.getBrokerPosition(brokerConfig, config.minSize));
      const brokerPositions = await Promise.all(promises);
      this._positionMap = _(brokerPositions).map(p => [p.broker, p]).fromPairs().value();
    } catch (ex) {
      this.log.error(ex.message);
      this.log.debug(ex.stack);
    } finally {
      this.isRefreshing = false;
      this.log.debug('Finished refresh.');
    }
  }

  private async getBrokerPosition(brokerConfig: BrokerConfig, minSize: number): Promise<BrokerPosition> {
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
    pos.longAllowed = new Decimal(allowedLongSize).gte(minSize);
    pos.shortAllowed = new Decimal(allowedShortSize).gte(minSize);
    return pos;
  }
} /* istanbul ignore next */