import { getLogger } from '@bitr/logger';
import { injectable, inject } from 'inversify';
import * as _ from 'lodash';
import {
  ConfigStore,
  SpreadAnalysisResult,
  ActivePairStore,
  Quote,
  OrderPair,
  OrderSide,
  PairWithSummary,
  PairSummary
} from './types';
import t from './intl';
import { padEnd, formatQuote } from './util';
import symbols from './symbols';
import PositionService from './PositionService';
import SpreadAnalyzer from './SpreadAnalyzer';
import LimitCheckerFactory from './LimitCheckerFactory';
import { EventEmitter } from 'events';
import { calcProfit } from './pnl';
import OrderImpl from './OrderImpl';
import { LOT_MIN_DECIMAL_PLACE } from './constants';
import * as OrderUtil from './OrderUtil';

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
      this.emit('spreadAnalysisDone', spreadAnalysisResult);
      const limitCheckResult = this.limitCheckerFactory.create(spreadAnalysisResult).check();
      if (!limitCheckResult.success) {
        this.status = limitCheckResult.reason;
        this.log.info(limitCheckResult.message);
        this.emit('limitCheckDone', limitCheckResult);
        // output profit in demo mode, so that report can pick up
        if (limitCheckResult.reason === 'Demo mode') {
          this.logOppotunity(spreadAnalysisResult);
        }
        return { found: false };
      }
      this.logOppotunity(spreadAnalysisResult);
      this.emit('limitCheckDone', { ...limitCheckResult, message: t`FoundArbitrageOppotunity` });
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
      this.log.info({ hidden: true }, t`OpenPairs`);
      const pairsWithSummary = await Promise.all(
        activePairsMap.map(async (kv): Promise<PairWithSummary> => {
          const { key, value: pair } = kv;
          try {
            const exitAnalysisResult = await this.spreadAnalyzer.analyze(
              quotes,
              this.positionService.positionMap,
              pair
            );
            return { key, pair, pairSummary: this.getPairSummary(pair, exitAnalysisResult), exitAnalysisResult };
          } catch (ex) {
            this.log.debug(ex.message);
            return { key, pair, pairSummary: this.getPairSummary(pair) };
          }
        })
      );
      this.emit('activePairRefresh', pairsWithSummary);
      pairsWithSummary.forEach(x => this.log.info({ hidden: true }, this.formatPairSummary(x.pair, x.pairSummary)));
      for (const pairWithSummary of pairsWithSummary.filter(x => x.exitAnalysisResult !== undefined)) {
        const limitChecker = this.limitCheckerFactory.create(
          pairWithSummary.exitAnalysisResult as SpreadAnalysisResult,
          pairWithSummary.pair
        );
        if (limitChecker.check().success) {
          return { closable: true, key: pairWithSummary.key, exitAnalysisResult: pairWithSummary.exitAnalysisResult };
        }
      }
    }
    return { closable: false };
  }

  private getPairSummary(pair: OrderPair, exitAnalysisResult?: SpreadAnalysisResult): PairSummary {
    const entryProfit = calcProfit(pair, this.configStore.config).profit;
    const buyLeg = pair.find(o => o.side === OrderSide.Buy) as OrderImpl;
    const sellLeg = pair.find(o => o.side === OrderSide.Sell) as OrderImpl;
    const midNotional = _.mean([buyLeg.averageFilledPrice, sellLeg.averageFilledPrice]) * buyLeg.filledSize;
    const entryProfitRatio = _.round(entryProfit / midNotional * 100, LOT_MIN_DECIMAL_PLACE);
    let currentExitCost;
    let currentExitCostRatio;
    let currentExitNetProfitRatio;
    if (exitAnalysisResult) {
      currentExitCost = -exitAnalysisResult.targetProfit;
      currentExitCostRatio = _.round(currentExitCost / midNotional * 100, LOT_MIN_DECIMAL_PLACE);
      currentExitNetProfitRatio = _.round(
        (entryProfit + exitAnalysisResult.targetProfit) / entryProfit * 100,
        LOT_MIN_DECIMAL_PLACE
      );
    }
    return {
      entryProfit,
      entryProfitRatio,
      currentExitCost,
      currentExitCostRatio,
      currentExitNetProfitRatio
    };
  }

  private formatPairSummary(pair: OrderPair, pairSummary: PairSummary) {
    const { entryProfit, entryProfitRatio, currentExitCost } = pairSummary;
    const entryProfitString = `Entry PL: ${entryProfit} (${entryProfitRatio}%)`;
    if (currentExitCost) {
      const currentExitCostText = `Current exit cost: ${currentExitCost}`;
      return `[${[
        OrderUtil.toShortString(pair[0]),
        OrderUtil.toShortString(pair[1]),
        entryProfitString,
        currentExitCostText
      ].join(', ')}]`;
    }
    return `[${[OrderUtil.toShortString(pair[0]), OrderUtil.toShortString(pair[1]), entryProfitString].join(', ')}]`;
  }

  private printSpreadAnalysisResult(result: SpreadAnalysisResult) {
    const columnWidth = 17;
    this.log.info({ hidden: true }, '%s: %s', padEnd(t`BestAsk`, columnWidth), formatQuote(result.ask));
    this.log.info({ hidden: true }, '%s: %s', padEnd(t`BestBid`, columnWidth), formatQuote(result.bid));
    this.log.info({ hidden: true }, '%s: %s', padEnd(t`Spread`, columnWidth), -result.invertedSpread);
    this.log.info({ hidden: true }, '%s: %s', padEnd(t`AvailableVolume`, columnWidth), result.availableVolume);
    this.log.info({ hidden: true }, '%s: %s', padEnd(t`TargetVolume`, columnWidth), result.targetVolume);
    this.log.info(
      { hidden: true },
      '%s: %s (%s%%)',
      padEnd(t`ExpectedProfit`, columnWidth),
      result.targetProfit,
      result.profitPercentAgainstNotional
    );
  }

  private logOppotunity(spreadAnalysisResult: SpreadAnalysisResult) {
    this.log.info(t`FoundArbitrageOppotunity` + ` => ${spreadAnalysisResult.bid.price}@${spreadAnalysisResult.bid.broker}/${spreadAnalysisResult.ask.price}@${spreadAnalysisResult.ask.broker}, profit: ${spreadAnalysisResult.targetProfit}(${spreadAnalysisResult.profitPercentAgainstNotional}%), volume: ${spreadAnalysisResult.targetVolume}(${spreadAnalysisResult.availableVolume})`);
  }
} /* istanbul ignore next */
