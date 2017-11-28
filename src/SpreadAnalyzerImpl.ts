import { injectable, inject } from 'inversify';
import {
  SpreadAnalyzer, ConfigStore, QuoteSide, SpreadAnalysisResult, BrokerMap, BrokerConfig
} from './type';
import { getLogger } from './logger';
import * as _ from 'lodash';
import Quote from './Quote';
import intl from './intl';
import BrokerPosition from './BrokerPosition';
import symbols from './symbols';
// tslint:disable-next-line:import-name
import Decimal from 'decimal.js';
import { calculateCommission } from './util';

const t = s => intl.t(s);
@injectable()
export default class SpreadAnalyzerImpl implements SpreadAnalyzer {
  private log = getLogger('SpreadAnalyzer');

  constructor(
    @inject(symbols.ConfigStore) readonly configStore: ConfigStore
  ) { }

  async analyze(quotes: Quote[], positionMap: BrokerMap<BrokerPosition>): Promise<SpreadAnalysisResult> {
    this.log.info(t('AnalyzingQuotes'));
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
      throw new Error(t('NoBestBidWasFound'));
    } else if (bestAsk === undefined) {
      throw new Error(t('NoBestAskWasFound'));
    }

    const invertedSpread = bestBid.price - bestAsk.price;
    const availableVolume = _.floor(_.min([bestBid.volume, bestAsk.volume]) as number, 2);
    const allowedShortSize = positionMap[bestBid.broker].allowedShortSize;
    const allowedLongSize = positionMap[bestAsk.broker].allowedLongSize;
    this.log.debug(`allowedShortSize: ${allowedShortSize}`);
    this.log.debug(`allowedLongSize: ${allowedLongSize}`);
    let targetVolume = _.min([availableVolume, config.maxSize, allowedShortSize, allowedLongSize]) as number;
    targetVolume = _.floor(targetVolume, 2);
    const commission = this.calculateTotalCommission([bestBid, bestAsk], targetVolume);
    const targetProfit = _.round(invertedSpread * targetVolume - commission);
    const spreadAnalysisResult = {
      bestBid,
      bestAsk,
      invertedSpread,
      availableVolume,
      targetVolume,
      targetProfit
    };
    this.log.debug(`Analysis done. Result: ${JSON.stringify(spreadAnalysisResult)}`);
    return spreadAnalysisResult;
  }

  private calculateTotalCommission(quotes: Quote[], targetVolume: number): number {
    const config = this.configStore.config;
    const commissions = _(quotes).map((q) => {
      const brokerConfig = config.brokers.find(x => x.broker === q.broker) as BrokerConfig;
      return calculateCommission(q.price, targetVolume, brokerConfig.commissionPercent);
    });
    return commissions.sum();
  }

  private isAllowedByCurrentPosition(q: Quote, pos: BrokerPosition): boolean {
    return q.side === QuoteSide.Bid ? pos.shortAllowed : pos.longAllowed;
  }
}