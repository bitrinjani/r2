import { injectable, inject } from 'inversify';
import {
  QuoteAggregator, ConfigStore, BrokerConfig,
  QuoteSide, BrokerAdapterRouter, Broker
} from './type';
import { getLogger } from './logger';
import * as _ from 'lodash';
import Quote from './Quote';
import symbols from './symbols';

@injectable()
export default class QuoteAggregatorImpl implements QuoteAggregator {
  private log = getLogger('QuoteAggregator');
  private timer;
  private isRunning: boolean;
  private _quotes: Quote[] = [];

  constructor(
    @inject(symbols.ConfigStore) readonly configStore: ConfigStore,
    @inject(symbols.BrokerAdapterRouter) readonly brokerAdapterRouter: BrokerAdapterRouter
  ) { }

  async start(): Promise<void> {
    this.log.debug('Starting Quote Aggregator...');
    this.timer = setInterval(this.aggregate.bind(this), this.configStore.config.iterationInterval);
    this.log.debug(`Iteration interval is set to ${this.configStore.config.iterationInterval}`);
    await this.aggregate();
    this.log.debug('Started Quote Aggregator.');
  }

  async stop(): Promise<void> {
    this.log.debug('Stopping Quote Aggregator...');
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.log.debug('Stopped Quote Aggregator.');
  }

  onQuoteUpdated: (quotes: Quote[]) => Promise<void>;

  private async aggregate(): Promise<void> {
    if (this.isRunning) {
      this.log.debug('Aggregator is already running. Skipped iteration.');
      return;
    }
    try {
      this.isRunning = true;
      this.log.debug('Aggregating quotes...');
      const enabledBrokers = this.getEnabledBrokers();
      const quotesMap =
        await Promise.all(enabledBrokers.map(x => this.brokerAdapterRouter.fetchQuotes(x)));
      const allQuotes = _.flatten(quotesMap);
      await this.setQuotes(this.fold(allQuotes, this.configStore.config.priceMergeSize));
      this.log.debug('Aggregated.');
    } catch (ex) {
      this.log.error(ex.message);
      this.log.debug(ex.stack);
    } finally {
      this.isRunning = false;
    }
  }

  private async setQuotes(value: Quote[]): Promise<void> {
    this._quotes = value;
    this.log.debug('New quotes have been set.');
    if (this.onQuoteUpdated) {
      this.log.debug('Calling onQuoteUpdated...');
      await this.onQuoteUpdated(this._quotes);
      this.log.debug('onQuoteUpdated done.');
    }
  }

  private getEnabledBrokers(): Broker[] {
    return _(this.configStore.config.brokers)
      .filter((b: BrokerConfig) => b.enabled)
      .map(b => b.broker)
      .value();
  }

  private fold(quotes: Quote[], step: number): Quote[] {
    return _(quotes)
      .groupBy((q: Quote) => {
        const price = q.side === QuoteSide.Ask ?
          _.ceil(q.price / step) * step :
          _.floor(q.price / step) * step;
        return _.join([price, q.broker, QuoteSide[q.side]], '#');
      })
      .map((value: Quote[], key) =>
        new Quote(
          value[0].broker,
          value[0].side,
          Number(key.substring(0, key.indexOf('#'))),
          _.sumBy(value, q => q.volume)
        )
      )
      .value();
  }
}