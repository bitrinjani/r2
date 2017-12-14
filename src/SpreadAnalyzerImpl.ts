import { injectable, inject } from 'inversify';
import {
  SpreadAnalyzer, ConfigStore, QuoteSide, SpreadAnalysisResult, BrokerMap
} from './types';
import { getLogger } from './logger';
import * as _ from 'lodash';
import Quote from './Quote';
import t from './intl';
import BrokerPosition from './BrokerPosition';
import symbols from './symbols';
import Decimal from 'decimal.js';
import { calculateCommission, findBrokerConfig } from './util';
import { LOT_MIN_DECIMAL_PLACE } from './constants';

@injectable()
export default class SpreadAnalyzerImpl implements SpreadAnalyzer {
  private log = getLogger(this.constructor.name);

  constructor(
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore
  ) { }

  async analyze(quotes: Quote[], positionMap: BrokerMap<BrokerPosition>): Promise<SpreadAnalysisResult> {
    this.log.info(t`AnalyzingQuotes`);
    const config = this.configStore.config;
    if (_.values(positionMap).length === 0) {
      throw new Error('Position map is empty.');
    }
    const filteredQuotes = _(quotes)
      .filter(q => this.isAllowedByCurrentPosition(q, positionMap[q.broker]))
      .filter(q => new Decimal(q.volume).gte(config.minSize))
      .orderBy(['price'])
      .value();
    const bestAsk = _(filteredQuotes).filter(q => q.side === QuoteSide.Ask).first();
    const bestBid = _(filteredQuotes).filter(q => q.side === QuoteSide.Bid).last();
    if (bestBid === undefined) {
      throw new Error(t`NoBestBidWasFound`);
    } else if (bestAsk === undefined) {
      throw new Error(t`NoBestAskWasFound`);
    }

    const invertedSpread = bestBid.price - bestAsk.price;
    const availableVolume = _.floor(_.min([bestBid.volume, bestAsk.volume]) as number, LOT_MIN_DECIMAL_PLACE);
    const allowedShortSize = positionMap[bestBid.broker].allowedShortSize;
    const allowedLongSize = positionMap[bestAsk.broker].allowedLongSize;
    let targetVolume = _.min([availableVolume, config.maxSize, allowedShortSize, allowedLongSize]) as number;
    targetVolume = _.floor(targetVolume, LOT_MIN_DECIMAL_PLACE);
    const commission = this.calculateTotalCommission([bestBid, bestAsk], targetVolume);
    const targetProfit = _.round(invertedSpread * targetVolume - commission);
    const midNotional = _.mean([bestAsk.price, bestBid.price]) * targetVolume;
    const profitPercentAgainstNotional = _.round((targetProfit / midNotional) * 100, LOT_MIN_DECIMAL_PLACE);
    const spreadAnalysisResult = {
      bestBid,
      bestAsk,
      invertedSpread,
      availableVolume,
      targetVolume,
      targetProfit,
      profitPercentAgainstNotional
    };
    this.log.debug(`Analysis done. Result: ${JSON.stringify(spreadAnalysisResult)}`);
    return spreadAnalysisResult;
  }

  private calculateTotalCommission(quotes: Quote[], targetVolume: number): number {
    return _(quotes).sumBy((q) => {
      const brokerConfig = findBrokerConfig(this.configStore.config, q.broker);
      return calculateCommission(q.price, targetVolume, brokerConfig.commissionPercent);
    });
  }

  private isAllowedByCurrentPosition(q: Quote, pos: BrokerPosition): boolean {
    return q.side === QuoteSide.Bid ? pos.shortAllowed : pos.longAllowed;
  }
}