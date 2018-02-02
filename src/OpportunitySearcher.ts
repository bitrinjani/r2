import { getLogger } from '@bitr/logger';
import { injectable, inject } from 'inversify';
import * as _ from 'lodash';
import { ConfigStore, SpreadAnalysisResult, ActivePairStore, Quote, OrderPair } from './types';
import t from './intl';
import { padEnd } from './util';
import symbols from './symbols';
import PositionService from './PositionService';
import SpreadAnalyzer from './SpreadAnalyzer';
import LimitCheckerFactory from './LimitCheckerFactory';
import { EventEmitter } from 'events';
import { calcProfit } from './pnl';

@injectable()
export default class OppotunitySearcher extends EventEmitter {
  private readonly log = getLogger(this.constructor.name);

  constructor(
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    private readonly positionService: PositionService,
    private readonly spreadAnalyzer: SpreadAnalyzer,
    private readonly limitCheckerFactory: LimitCheckerFactory,
    @inject(symbols.ActivePairStore) private readonly activePairStore: ActivePairStore
  ) {
    super();
  }

  set status(value: string) {
    this.emit('status', value);
  }

  async search(
    quotes: Quote[]
  ): Promise<{ found: false } | { found: true; spreadAnalysisResult: SpreadAnalysisResult; closable: boolean }> {
    this.log.info(t`LookingForOpportunity`);
    const { closable, key: closablePairKey, exitAnalysisResult } = await this.findClosable(quotes);
    if (closable) {
      this.log.info(t`FoundClosableOrders`);
      const spreadAnalysisResult = exitAnalysisResult as SpreadAnalysisResult;
      this.log.debug(`Deleting key ${closablePairKey}.`);
      await this.activePairStore.del(closablePairKey as string);
      return { found: true, spreadAnalysisResult, closable };
    }

    try {
      const spreadAnalysisResult = await this.spreadAnalyzer.analyze(quotes, this.positionService.positionMap);
      this.printSpreadAnalysisResult(spreadAnalysisResult);
      const limitCheckResult = this.limitCheckerFactory.create(spreadAnalysisResult).check();
      if (!limitCheckResult.success) {
        this.status = limitCheckResult.reason;
        this.log.info(limitCheckResult.message);
        return { found: false };
      }
      this.log.info(t`FoundArbitrageOppotunity`);
      return { found: true, spreadAnalysisResult, closable };
    } catch (ex) {
      this.status = 'Spread analysis failed';
      this.log.warn(t`FailedToGetASpreadAnalysisResult`, ex.message);
      this.log.debug(ex.stack);
      return { found: false };
    }
  }

  private async findClosable(
    quotes: Quote[]
  ): Promise<{ closable: boolean; key?: string; exitAnalysisResult?: SpreadAnalysisResult }> {
    const { minExitTargetProfit, minExitTargetProfitPercent, exitNetProfitRatio } = this.configStore.config;
    if ([minExitTargetProfit, minExitTargetProfitPercent, exitNetProfitRatio].every(_.isUndefined)) {
      return { closable: false };
    }
    const activePairsMap = await this.activePairStore.getAll();
    if (activePairsMap.length > 0) {
      this.log.info(t`OpenPairs`);
    }
    for (const { key, value: pair } of activePairsMap) {
      let exitAnalysisResult: SpreadAnalysisResult | undefined;
      try {
        exitAnalysisResult = await this.spreadAnalyzer.analyze(quotes, this.positionService.positionMap, pair);
        this.log.debug(`pair: ${pair}, result: ${JSON.stringify(exitAnalysisResult)}.`);
        const limitResult = this.limitCheckerFactory.create(exitAnalysisResult, pair).check();
        if (limitResult.success) {
          return { closable: true, key, exitAnalysisResult };
        }
      } catch (ex) {
        this.log.debug(ex.message);
      } finally {
        this.log.info(this.formatPairInfo(pair, exitAnalysisResult));
      }
    }
    return { closable: false };
  }

  private formatPairInfo(pair: OrderPair, exitAnalysisResult?: SpreadAnalysisResult) {
    if (exitAnalysisResult) {
      return `[${pair[0].toShortString()}, ${pair[1].toShortString()}, Entry PL: ${_.round(
        calcProfit(pair, this.configStore.config).profit
      )} JPY, Current exit cost: ${_.round(-exitAnalysisResult.targetProfit)} JPY]`;
    }
    return `[${pair[0].toShortString()}, ${pair[1].toShortString()}, Entry PL: ${_.round(
      calcProfit(pair, this.configStore.config).profit
    )} JPY]`;
  }

  private printSpreadAnalysisResult(result: SpreadAnalysisResult) {
    const columnWidth = 17;
    this.log.info('%s: %s', padEnd(t`BestAsk`, columnWidth), result.ask.toString());
    this.log.info('%s: %s', padEnd(t`BestBid`, columnWidth), result.bid.toString());
    this.log.info('%s: %s', padEnd(t`Spread`, columnWidth), -result.invertedSpread);
    this.log.info('%s: %s', padEnd(t`AvailableVolume`, columnWidth), result.availableVolume);
    this.log.info('%s: %s', padEnd(t`TargetVolume`, columnWidth), result.targetVolume);
    this.log.info(
      '%s: %s (%s%%)',
      padEnd(t`ExpectedProfit`, columnWidth),
      result.targetProfit,
      result.profitPercentAgainstNotional
    );
  }
} /* istanbul ignore next */
