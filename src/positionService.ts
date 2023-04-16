import type { BrokerConfigType } from "./config";
import type { BrokerMap, BrokerPosition } from "./types";

import { EventEmitter } from "events";

import { getLogger } from "@bitr/logger";
import Decimal from "decimal.js";
import { injectable, inject } from "inversify";
import _ from "lodash";

import BrokerAdapterRouter from "./brokerAdapterRouter";
import BrokerStabilityTracker from "./brokerStabilityTracker";
import t from "./i18n";
import symbols from "./symbols";
import { ConfigStore } from "./types";
import { hr, eRound, splitSymbol, padEnd, padStart } from "./util";


@injectable()
export default class PositionService extends EventEmitter {
  private readonly log = getLogger(this.constructor.name);
  private timer;
  private isRefreshing: boolean;
  private _positionMap: BrokerMap<BrokerPosition>;

  constructor(
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    private readonly brokerAdapterRouter: BrokerAdapterRouter,
    private readonly brokerStabilityTracker: BrokerStabilityTracker
  ) {
    super();
  }

  async start(): Promise<void> {
    this.log.debug("Starting PositionService...");
    this.timer = setInterval(() => this.refresh(), this.configStore.config.positionRefreshInterval);
    await this.refresh();
    this.log.debug("Started PositionService.");
  }

  async stop(): Promise<void> {
    this.log.debug("Stopping PositionService...");
    if(this.timer){
      clearInterval(this.timer);
    }
    this.log.debug("Stopped PositionService.");
  }

  print(): void {
    const { baseCcy } = splitSymbol(this.configStore.config.symbol);
    const isOk = b => b ? "OK" : "NG";
    const formatBrokerPosition = (brokerPosition: BrokerPosition) =>
      `${padEnd(brokerPosition.broker, 10)}: ${padStart(_.round(brokerPosition.baseCcyPosition, 3), 6)} ${baseCcy}, `
      + `${t`LongAllowed`}: ${isOk(brokerPosition.longAllowed)}, `
      + `${t`ShortAllowed`}: ${isOk(brokerPosition.shortAllowed)}`;

    this.log.info({ hidden: true }, `${hr(21)}POSITION${hr(21)}`);
    this.log.info({ hidden: true }, `Net Exposure: ${_.round(this.netExposure, 3)} ${baseCcy}`);
    _.each(this.positionMap, (position: BrokerPosition) => {
      const stability = this.brokerStabilityTracker.stability(position.broker);
      this.log.info({ hidden: true }, `${formatBrokerPosition(position)} (Stability: ${stability})`);
    });
    this.log.info({ hidden: true }, hr(50));
    this.log.debug(JSON.stringify(this.positionMap));
  }

  get netExposure() {
    return eRound(_.sumBy(_.values(this.positionMap), (p: BrokerPosition) => p.baseCcyPosition));
  }

  get positionMap() {
    return this._positionMap;
  }

  private async refresh(): Promise<void> {
    this.log.debug("Refreshing positions...");
    if(this.isRefreshing){
      this.log.debug("Already refreshing.");
      return;
    }
    try{
      this.isRefreshing = true;
      const config = this.configStore.config;
      const brokerConfigs = config.brokers.filter(b => b.enabled);
      const promises = brokerConfigs.map(brokerConfig => this.getBrokerPosition(brokerConfig, config.minSize));
      const brokerPositions = await Promise.all(promises);
      this._positionMap = _(brokerPositions)
        .map((p: BrokerPosition) => [p.broker, p])
        .fromPairs()
        .value();
      this.emit("positionUpdated", this.positionMap);
    } catch(ex){
      this.log.error(ex.message);
      this.log.debug(ex.stack);
    } finally{
      this.isRefreshing = false;
      this.log.debug("Finished refresh.");
    }
  }

  private async getBrokerPosition(brokerConfig: BrokerConfigType, minSize: number): Promise<BrokerPosition> {
    const { baseCcy } = splitSymbol(this.configStore.config.symbol);
    const positions = await this.brokerAdapterRouter.getPositions(brokerConfig.broker);
    const baseCcyPosition = positions.get(baseCcy);
    if(baseCcyPosition === undefined){
      throw new Error(`Unable to find base ccy position in ${brokerConfig.broker}. ${JSON.stringify([...positions])}`);
    }
    const allowedLongSize = _.max([
      0,
      new Decimal(brokerConfig.maxLongPosition).minus(baseCcyPosition)
        .toNumber(),
    ]) as number;
    const allowedShortSize = _.max([
      0,
      new Decimal(brokerConfig.maxShortPosition).plus(baseCcyPosition)
        .toNumber(),
    ]) as number;
    const isStable = this.brokerStabilityTracker.isStable(brokerConfig.broker);
    return {
      broker: brokerConfig.broker,
      baseCcyPosition,
      allowedLongSize,
      allowedShortSize,
      longAllowed: new Decimal(allowedLongSize).gte(minSize) && isStable,
      shortAllowed: new Decimal(allowedShortSize).gte(minSize) && isStable,
    };
  }
} /* istanbul ignore next */
