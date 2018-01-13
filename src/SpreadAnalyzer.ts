import { injectable, inject } from 'inversify';
import {
  ConfigStore,
  QuoteSide,
  SpreadAnalysisResult,
  BrokerMap,
  OrderSide,
  Quote,
  BrokerPosition,
  OrderPair,
  SpreadStat
} from './types';
import { getLogger } from './logger';
import * as _ from 'lodash';
import t from './intl';
import symbols from './symbols';
import Decimal from 'decimal.js';
import { findBrokerConfig } from './configUtil';
import { LOT_MIN_DECIMAL_PLACE } from './constants';
import OrderImpl from './OrderImpl';
import { calcCommission } from './pnl';

@injectable()
export default class SpreadAnalyzer {
  private readonly log = getLogger(this.constructor.name);

  constructor(@inject(symbols.ConfigStore) private readonly configStore: ConfigStore) {}

  async analyze(
    quotes: Quote[],
    positionMap: BrokerMap<BrokerPosition>,
    closingPair?: OrderPair
  ): Promise<SpreadAnalysisResult> {
    if (closingPair && closingPair[0].size !== closingPair[1].size) {
      throw new Error('Invalid closing pair.');
    }

    const { config } = this.configStore;
    if (_.isEmpty(positionMap)) {
      throw new Error('Position map is empty.');
    }
    let filteredQuotes = _(quotes)
      .filter(q => this.isAllowedByCurrentPosition(q, positionMap[q.broker]))
      .filter(q => new Decimal(q.volume).gte(config.minSize))
      .orderBy(['price'])
      .value();
    if (closingPair) {
      const isOppositeSide = (o: OrderImpl, q: Quote) =>
        q.side === (o.side === OrderSide.Buy ? QuoteSide.Bid : QuoteSide.Ask);
      const isSameBroker = (o: OrderImpl, q: Quote) => o.broker === q.broker;
      filteredQuotes = _(filteredQuotes)
        .filter(
          q =>
            (isSameBroker(closingPair[0], q) && isOppositeSide(closingPair[0], q)) ||
            (isSameBroker(closingPair[1], q) && isOppositeSide(closingPair[1], q))
        )
        .filter(q => new Decimal(q.volume).gte(closingPair[0].size))
        .value();
    }
    const { ask, bid } = this.getBest(filteredQuotes);
    if (bid === undefined) {
      throw new Error(t`NoBestBidWasFound`);
    } else if (ask === undefined) {
      throw new Error(t`NoBestAskWasFound`);
    }

    const invertedSpread = bid.price - ask.price;
    const availableVolume = _.floor(_.min([bid.volume, ask.volume]) as number, LOT_MIN_DECIMAL_PLACE);
    const allowedShortSize = positionMap[bid.broker].allowedShortSize;
    const allowedLongSize = positionMap[ask.broker].allowedLongSize;
    let targetVolume = _.min([availableVolume, config.maxSize, allowedShortSize, allowedLongSize]) as number;
    targetVolume = _.floor(targetVolume, LOT_MIN_DECIMAL_PLACE);
    if (closingPair) {
      targetVolume = closingPair[0].size;
    }
    const commission = this.calculateTotalCommission([bid, ask], targetVolume);
    const targetProfit = _.round(invertedSpread * targetVolume - commission);
    const midNotional = _.mean([ask.price, bid.price]) * targetVolume;
    const profitPercentAgainstNotional = _.round(targetProfit / midNotional * 100, LOT_MIN_DECIMAL_PLACE);
    const spreadAnalysisResult = {
      bid,
      ask,
      invertedSpread,
      availableVolume,
      targetVolume,
      targetProfit,
      profitPercentAgainstNotional
    };
    this.log.debug(`Analysis done. Result: ${JSON.stringify(spreadAnalysisResult)}`);
    return spreadAnalysisResult;
  }

  async getSpreadStat(quotes: Quote[]): Promise<SpreadStat | undefined> {
    const { config } = this.configStore;
    const filteredQuotes = _(quotes)
      .filter(q => new Decimal(q.volume).gte(config.minSize))
      .orderBy(['price'])
      .value();
    const asks = _(filteredQuotes).filter(q => q.side === QuoteSide.Ask);
    const bids = _(filteredQuotes).filter(q => q.side === QuoteSide.Bid);
    if (asks.isEmpty() || bids.isEmpty()) {
      return undefined;
    }
    const byBroker = _(filteredQuotes)
      .groupBy(q => q.broker)
      .mapValues(qs => {
        const { ask, bid } = this.getBest(qs);
        const spread = ask && bid ? ask.price - bid.price : undefined;
        return { ask, bid, spread };
      })
      .value();
    const flattened = _(byBroker)
      .map((v, k) => [v.ask, v.bid])  
      .flatten()      
      .filter(q => q !== undefined)
      .value() as Quote[];
    const { ask: bestAsk, bid: bestBid } = this.getBest(flattened) as { ask: Quote, bid: Quote };
    const { ask: worstAsk, bid: worstBid } = this.getWorst(flattened) as { ask: Quote, bid: Quote };
    const bestCase = this.getEstimate(bestAsk, bestBid);
    const worstCase = this.getEstimate(worstAsk, worstBid);
    return {
      timestamp: Date.now(),
      byBroker,
      bestCase,
      worstCase
    };
  }

  private getEstimate(ask: Quote, bid: Quote): SpreadAnalysisResult {
    const invertedSpread = bid.price - ask.price;
    const availableVolume = _.floor(_.min([bid.volume, ask.volume]) as number, LOT_MIN_DECIMAL_PLACE);
    let targetVolume = _.min([availableVolume, this.configStore.config.maxSize]) as number;
    targetVolume = _.floor(targetVolume, LOT_MIN_DECIMAL_PLACE);
    const commission = this.calculateTotalCommission([bid, ask], targetVolume);
    const targetProfit = _.round(invertedSpread * targetVolume - commission);
    const midNotional = _.mean([ask.price, bid.price]) * targetVolume;
    const profitPercentAgainstNotional = _.round(targetProfit / midNotional * 100, LOT_MIN_DECIMAL_PLACE);
    return {
      ask,
      bid,
      invertedSpread,
      availableVolume,
      targetVolume,
      targetProfit,
      profitPercentAgainstNotional
    };
  }

  private getBest(quotes: Quote[]) {
    const ordered = _.orderBy(quotes, ['price']);
    const ask = _(ordered)
      .filter(q => q.side === QuoteSide.Ask)
      .first();
    const bid = _(ordered)
      .filter(q => q.side === QuoteSide.Bid)
      .last();
    return { ask, bid };
  }

  private getWorst(quotes: Quote[]) {
    const ordered = _.orderBy(quotes, ['price']);
    const ask = _(ordered)
      .filter(q => q.side === QuoteSide.Ask)
      .last();
    const bid = _(ordered)
      .filter(q => q.side === QuoteSide.Bid)
      .first();
    return { ask, bid };
  }

  private calculateTotalCommission(quotes: Quote[], targetVolume: number): number {
    return _(quotes).sumBy(q => {
      const brokerConfig = findBrokerConfig(this.configStore.config, q.broker);
      return calcCommission(q.price, targetVolume, brokerConfig.commissionPercent);
    });
  }

  private isAllowedByCurrentPosition(q: Quote, pos: BrokerPosition): boolean {
    return q.side === QuoteSide.Bid ? pos.shortAllowed : pos.longAllowed;
  }
} /* istanbul ignore next */
