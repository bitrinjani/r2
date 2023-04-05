import { getLogger } from '@bitr/logger';
import { injectable, inject } from 'inversify';
import * as _ from 'lodash';
import { ConfigStore, Quote } from './types';
import t from './intl';
import { hr, delay } from './util';
import symbols from './symbols';
import { fatalErrors } from './constants';
import QuoteAggregator from './QuoteAggregator';
import PositionService from './PositionService';
import OpportunitySearcher from './OpportunitySearcher';
import PairTrader from './PairTrader';

@injectable()
export default class Arbitrager {
  private readonly log = getLogger(this.constructor.name);
  private shouldStop: boolean = false;
  status: string = 'Init';
  private handlerRef: (quotes: Quote[]) => Promise<void>;

  constructor(
    private readonly quoteAggregator: QuoteAggregator,
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    private readonly positionService: PositionService,
    private readonly opportunitySearcher: OpportunitySearcher,
    private readonly pairTrader: PairTrader
  ) {
    this.opportunitySearcher.on('status', x => (this.status = x));
    this.pairTrader.on('status', x => (this.status = x));
  }

  async start(): Promise<void> {
    this.status = 'Starting';
    this.log.info(t`StartingArbitrager`);
    this.handlerRef = this.quoteUpdated.bind(this);
    this.quoteAggregator.on('quoteUpdated', this.handlerRef);
    this.status = 'Started';
    this.log.info(t`StartedArbitrager`);
  }

  async stop(): Promise<void> {
    this.status = 'Stopping';
    this.log.info('Stopping Arbitrager...');
    this.quoteAggregator.removeListener('quoteUpdated', this.handlerRef);
    this.log.info('Stopped Arbitrager.');
    this.status = 'Stopped';
    this.shouldStop = true;
  }

  private async quoteUpdated(quotes: Quote[]): Promise<void> {
    if (this.shouldStop) {
      await this.stop();
      return;
    }
    this.positionService.print();
    this.log.info({ hidden: true }, `${hr(20)  }ARBITRAGER${  hr(20)}`);
    await this.arbitrage(quotes);
    this.log.info({ hidden: true }, hr(50));
  }

  private async arbitrage(quotes: Quote[]): Promise<void> {
    this.status = 'Arbitraging';
    const searchResult = await this.opportunitySearcher.search(quotes);
    if (!searchResult.found) {
      return;
    }

    try {
      await this.pairTrader.trade(searchResult.spreadAnalysisResult, searchResult.closable);
    } catch (ex) {
      this.status = 'Order send/refresh failed';
      this.log.error(ex.message);
      this.log.debug(ex.stack);
      if (_.some(fatalErrors, keyword => _.includes(ex.message, keyword))) {
        this.shouldStop = true;
      }
    }

    this.log.info(t`SleepingAfterSend`, this.configStore.config.sleepAfterSend);
    await delay(this.configStore.config.sleepAfterSend);
  }
} /* istanbul ignore next */
