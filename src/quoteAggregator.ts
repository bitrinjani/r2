import type { BrokerConfig, Broker, Quote } from "./types";

import { AwaitableEventEmitter } from "@bitr/awaitable-event-emitter";
import { getLogger } from "@bitr/logger";
import { injectable, inject } from "inversify";
import * as _ from "lodash";
import { DateTime, Interval } from "luxon";

import BrokerAdapterRouter from "./brokerAdapterRouter";
import symbols from "./symbols";
import { ConfigStore, QuoteSide } from "./types";

@injectable()
export default class QuoteAggregator extends AwaitableEventEmitter {
  private readonly log = getLogger(this.constructor.name);
  private timer;
  private isRunning: boolean;
  private quotes: Quote[] = [];

  constructor(
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    private readonly brokerAdapterRouter: BrokerAdapterRouter
  ) {
    super();
  }

  async start(): Promise<void> {
    this.log.debug("Starting Quote Aggregator...");
    const { iterationInterval } = this.configStore.config;
    this.timer = setInterval(this.aggregate.bind(this), iterationInterval);
    this.log.debug(`Iteration interval is set to ${iterationInterval}`);
    await this.aggregate();
    this.log.debug("Started Quote Aggregator.");
  }

  async stop(): Promise<void> {
    this.log.debug("Stopping Quote Aggregator...");
    if(this.timer){
      clearInterval(this.timer);
    }
    this.log.debug("Stopped Quote Aggregator.");
  }

  private async aggregate(): Promise<void> {
    if(this.isRunning){
      this.log.debug("Aggregator is already running. Skipped iteration.");
      return;
    }
    try{
      this.isRunning = true;
      this.log.debug("Aggregating quotes...");
      const enabledBrokers = this.getEnabledBrokers();
      const fetchTasks = enabledBrokers.map(x => this.brokerAdapterRouter.fetchQuotes(x));
      const quotesMap = await Promise.all(fetchTasks);
      const allQuotes = _.flatten(quotesMap);
      await this.setQuotes(this.fold(allQuotes, this.configStore.config.priceMergeSize));
      this.log.debug("Aggregated.");
    } catch(ex){
      this.log.error(ex.message);
      this.log.debug(ex.stack);
    } finally{
      this.isRunning = false;
    }
  }

  private async setQuotes(value: Quote[]): Promise<void> {
    this.quotes = value;
    this.log.debug("New quotes have been set.");
    this.log.debug("Calling onQuoteUpdated...");
    await this.emitParallel("quoteUpdated", this.quotes);
    this.log.debug("onQuoteUpdated done.");
  }

  private getEnabledBrokers(): Broker[] {
    return _(this.configStore.config.brokers)
      .filter(b => b.enabled)
      .filter(b => this.timeFilter(b))
      .map(b => b.broker)
      .value();
  }

  private timeFilter(brokerConfig: BrokerConfig): boolean {
    if(_.isEmpty(brokerConfig.noTradePeriods)){
      return true;
    }
    const current = DateTime.local();
    const outOfPeriod = period => {
      const interval = Interval.fromISO(`${period[0]}/${period[1]}`);
      if(!interval.isValid){
        this.log.warn("Invalid noTradePeriods. Ignoring the config.");
        return true;
      }
      return !interval.contains(current);
    };
    return brokerConfig.noTradePeriods.every(outOfPeriod);
  }

  private fold(quotes: Quote[], step: number): Quote[] {
    return _(quotes)
      .groupBy((q: Quote) => {
        const price = q.side === QuoteSide.Ask ? _.ceil(q.price / step) * step : _.floor(q.price / step) * step;
        return _.join([price, q.broker, QuoteSide[q.side]], "#");
      })
      .map((value: Quote[], key) => ({
        broker: value[0].broker,
        side: value[0].side,
        price: Number(key.substring(0, key.indexOf("#"))),
        volume: _.sumBy(value, q => q.volume),
      }))
      .value();
  }
} /* istanbul ignore next */
