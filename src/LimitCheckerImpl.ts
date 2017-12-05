import {
  LimitChecker, LimitCheckResult, PositionService, ConfigStore, SpreadAnalysisResult
} from './types';
import { getLogger } from './logger';
import * as _ from 'lodash';
import intl from './intl';

const t = s => intl.t(s);

export default class LimitCheckerImpl implements LimitChecker {
  private log = getLogger(this.constructor.name);
  private limits: Limit[];

  constructor(
    configStore: ConfigStore,
    positionService: PositionService,
    spreadAnalysisResult: SpreadAnalysisResult
  ) {
    this.limits = [
      new MaxNetExposureLimit(configStore, positionService),
      new InvertedSpreadLimit(spreadAnalysisResult),
      new TargetProfitLimit(configStore, spreadAnalysisResult),
      new DemoModeLimit(configStore)
    ];
  }

  check(): LimitCheckResult {
    for (const limit of this.limits) {
      this.log.debug(`checking ${limit.constructor.name}...`);
      const result = limit.check();
      this.log.debug(`The result is %o.`, result);
      if (!result.success) {
        return result;
      }
    }
    return { success: true };
  }
}

interface Limit {
  check(): LimitCheckResult;
}

class MaxNetExposureLimit implements Limit {
  private log = getLogger('MaxNetExposureLimit');

  constructor(
    private readonly configStore: ConfigStore,
    private readonly positionService: PositionService
  ) { }

  check() {
    const success = Math.abs(this.positionService.netExposure) <= this.configStore.config.maxNetExposure;
    if (success) {
      return { success };
    }
    const reason = 'Max exposure breached';
    this.log.info(t('NetExposureIsLargerThanMaxNetExposure'));
    return { success, reason };
  }
}

class InvertedSpreadLimit implements Limit {
  private log = getLogger('InvertedSpreadLimit');

  constructor(private readonly spreadAnalysisResult: SpreadAnalysisResult) { }

  check() {
    const success = this.spreadAnalysisResult.invertedSpread > 0;
    if (success) {
      return { success };
    }
    const reason = 'Spread not inverted';
    this.log.info(t('NoArbitrageOpportunitySpreadIsNotInverted'));
    return { success, reason };
  }
}

class TargetProfitLimit implements Limit {
  private log = getLogger('TargetProfitLimit');

  constructor(
    private readonly configStore: ConfigStore,
    private readonly spreadAnalysisResult: SpreadAnalysisResult) { }

  check() {
    const success = this.isTargetProfitLargeEnough();
    if (success) {
      return { success };
    }
    const reason = 'Too small profit';
    this.log.info(t('TargetProfitIsSmallerThanMinProfit'));
    return { success, reason };
  }

  private isTargetProfitLargeEnough(): boolean {
    const config = this.configStore.config;
    const { bestBid, bestAsk, targetVolume, targetProfit } = this.spreadAnalysisResult;
    const minTargetProfit = _.max([
      config.minTargetProfit,
      config.minTargetProfitPercent !== undefined ?
        _.round((config.minTargetProfitPercent / 100) * _.mean([bestAsk.price, bestBid.price]) * targetVolume) :
        0
    ]) as number;
    return targetProfit >= minTargetProfit;
  }
}

class DemoModeLimit implements Limit {
  private log = getLogger('DemoModeLimit');

  constructor(private readonly configStore: ConfigStore) { }

  check() {
    const success = !this.configStore.config.demoMode;
    if (success) {
      return { success };
    }
    const reason = 'Demo mode';
    this.log.info(t('ThisIsDemoModeNotSendingOrders'));
    return { success, reason };
  }
}