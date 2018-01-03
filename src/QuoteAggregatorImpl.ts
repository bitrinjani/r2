import { injectable, inject } from 'inversify';
import { QuoteAggregator, ConfigStore, BrokerConfig, QuoteSide, BrokerAdapterRouter, Broker, Quote } from './types';
import { getLogger } from './logger';
import * as _ from 'lodash';
import symbols from './symbols';
import QuoteImpl from './QuoteImpl';

@injectable()
export default class QuoteAggregatorImpl implements QuoteAggregator {
  private readonly log = getLogger(this.constructor.name);
  private timer;
  private isRunning: boolean;
  private quotes: Quote[] = [];

  constructor(
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    @inject(symbols.BrokerAdapterRouter) private readonly brokerAdapterRouter: BrokerAdapterRouter
  ) {}

  async start(): Promise<void> {
    this.log.debug('Starting Quote Aggregator...');
    const { iterationInterval } = this.configStore.config;
    this.timer = setInterval(this.aggregate.bind(this), iterationInterval);
    this.log.debug(`Iteration interval is set to ${iterationInterval}`);
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
      const fetchTasks = enabledBrokers.map(x => this.brokerAdapterRouter.fetchQuotes(x));
      const quotesMap = await Promise.all(fetchTasks);
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
    this.quotes = value;
    this.log.debug('New quotes have been set.');
    if (this.onQuoteUpdated) {
      this.log.debug('Calling onQuoteUpdated...');
      await this.onQuoteUpdated(this.quotes);
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
        const price = q.side === QuoteSide.Ask ? _.ceil(q.price / step) * step : _.floor(q.price / step) * step;
        return _.join([price, q.broker, QuoteSide[q.side]], '#');
      })
      .map(
        (value: Quote[], key) =>
          new QuoteImpl(
            value[0].broker,
            value[0].side,
            Number(key.substring(0, key.indexOf('#'))),
            _.sumBy(value, q => q.volume)
          )
      )
      .value();
  }
} /* istanbul ignore next */
