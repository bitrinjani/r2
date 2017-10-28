import { injectable, inject } from 'inversify';
import { SpreadAnalyzer, ConfigStore, QuoteSide, SpreadAnalysisResult, BrokerMap
  } from './type';
import { getLogger } from './logger';
import * as _ from 'lodash';
import Quote from './Quote';
import intl from './intl';
import BrokerPosition from './BrokerPosition';
import symbols from './symbols';

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

    const bestAsk = _(quotes).filter(q => q.side === QuoteSide.Ask)
      .filter(q => this.isAllowed(q, positionMap[q.broker]))
      .orderBy(['price']).first();
    const bestBid = _(quotes).filter(q => q.side === QuoteSide.Bid)
      .filter(q => this.isAllowed(q, positionMap[q.broker]))
      .orderBy(['price'], ['desc']).first();
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
    const targetProfit = _.round(invertedSpread * targetVolume);
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

  private isAllowed(q: Quote, pos: BrokerPosition): boolean {
    return q.side === QuoteSide.Bid ? pos.shortAllowed : pos.longAllowed;
  }
}