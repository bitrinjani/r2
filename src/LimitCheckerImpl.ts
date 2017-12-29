import { LimitChecker, LimitCheckResult, PositionService, ConfigStore, SpreadAnalysisResult } from './types';
import { getLogger } from './logger';
import * as _ from 'lodash';
import t from './intl';

export default class LimitCheckerImpl implements LimitChecker {
  private readonly log = getLogger(this.constructor.name);
  private limits: LimitChecker[];

  constructor(
    configStore: ConfigStore,
    positionService: PositionService,
    spreadAnalysisResult: SpreadAnalysisResult,
    exitFlag: boolean
  ) {
    if (exitFlag) {
      this.limits = [
        new MaxNetExposureLimit(configStore, positionService),
        new MaxTargetProfitLimit(configStore, spreadAnalysisResult),
        new DemoModeLimit(configStore)
      ];
    } else {
      this.limits = [
        new MaxNetExposureLimit(configStore, positionService),
        new InvertedSpreadLimit(spreadAnalysisResult),
        new MinTargetProfitLimit(configStore, spreadAnalysisResult),
        new MaxTargetProfitLimit(configStore, spreadAnalysisResult),
        new MaxTargetVolumeLimit(configStore, spreadAnalysisResult),
        new DemoModeLimit(configStore)
      ];
    }
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
    return { success: true, reason: '' };
  }
}

class MaxNetExposureLimit implements LimitChecker {
  private readonly log = getLogger('MaxNetExposureLimit');

  constructor(private readonly configStore: ConfigStore, private readonly positionService: PositionService) {}

  check() {
    const success = Math.abs(this.positionService.netExposure) <= this.configStore.config.maxNetExposure;
    if (success) {
      return { success, reason: '' };
    }
    const reason = 'Max exposure breached';
    this.log.info(t`NetExposureIsLargerThanMaxNetExposure`);
    return { success, reason };
  }
}

class InvertedSpreadLimit implements LimitChecker {
  private readonly log = getLogger('InvertedSpreadLimit');

  constructor(private readonly spreadAnalysisResult: SpreadAnalysisResult) {}

  check() {
    const success = this.spreadAnalysisResult.invertedSpread > 0;
    if (success) {
      return { success, reason: '' };
    }
    const reason = 'Spread not inverted';
    this.log.info(t`NoArbitrageOpportunitySpreadIsNotInverted`);
    return { success, reason };
  }
}

class MinTargetProfitLimit implements LimitChecker {
  private readonly log = getLogger('TargetProfitLimit');

  constructor(private readonly configStore: ConfigStore, private readonly spreadAnalysisResult: SpreadAnalysisResult) {}

  check() {
    const success = this.isTargetProfitLargeEnough();
    if (success) {
      return { success, reason: '' };
    }
    const reason = 'Too small profit';
    this.log.info(t`TargetProfitIsSmallerThanMinProfit`);
    return { success, reason };
  }

  private isTargetProfitLargeEnough(): boolean {
    const config = this.configStore.config;
    const { bestBid, bestAsk, targetVolume, targetProfit } = this.spreadAnalysisResult;
    const targetVolumeNotional = _.mean([bestAsk.price, bestBid.price]) * targetVolume;
    const effectiveMinTargetProfit = _.max([
      config.minTargetProfit,
      config.minTargetProfitPercent !== undefined
        ? _.round(config.minTargetProfitPercent / 100 * targetVolumeNotional)
        : 0
    ]) as number;
    return targetProfit >= effectiveMinTargetProfit;
  }
}

class MaxTargetProfitLimit implements LimitChecker {
  private readonly log = getLogger('MaxTargetProfitLimit');

  constructor(private readonly configStore: ConfigStore, private readonly spreadAnalysisResult: SpreadAnalysisResult) {}

  check() {
    const success = this.isProfitSmallerThanLimit();
    if (success) {
      return { success, reason: '' };
    }
    const reason = 'Too large profit';
    this.log.info(t`TargetProfitIsLargerThanMaxProfit`);
    return { success, reason };
  }

  private isProfitSmallerThanLimit(): boolean {
    const { config } = this.configStore;
    const { bestBid, bestAsk, targetVolume, targetProfit } = this.spreadAnalysisResult;
    const maxTargetProfit = _.min([
      config.maxTargetProfit,
      config.maxTargetProfitPercent !== undefined
        ? _.round(config.maxTargetProfitPercent / 100 * _.mean([bestAsk.price, bestBid.price]) * targetVolume)
        : Number.MAX_SAFE_INTEGER
    ]) as number;
    return targetProfit <= maxTargetProfit;
  }
}

class MaxTargetVolumeLimit implements LimitChecker {
  private readonly log = getLogger('MaxTargetVolumeLimit');

  constructor(private readonly configStore: ConfigStore, private readonly spreadAnalysisResult: SpreadAnalysisResult) {}

  check() {
    const success = this.isVolumeSmallerThanLimit();
    if (success) {
      return { success, reason: '' };
    }
    const reason = 'Too large Volume';
    this.log.info(t`TargetVolumeIsLargerThanMaxTargetVolumePercent`);
    return { success, reason };
  }

  private isVolumeSmallerThanLimit(): boolean {
    const { config } = this.configStore;
    const { availableVolume, targetVolume } = this.spreadAnalysisResult;
    const maxTargetVolume = _.min([
      config.maxTargetVolumePercent !== undefined
        ? _.round(config.maxTargetVolumePercent / 100 * availableVolume)
        : Number.MAX_SAFE_INTEGER
    ]) as number;
    return targetVolume <= maxTargetVolume;
  }
}

class DemoModeLimit implements LimitChecker {
  private readonly log = getLogger('DemoModeLimit');

  constructor(private readonly configStore: ConfigStore) {}

  check() {
    const success = !this.configStore.config.demoMode;
    if (success) {
      return { success, reason: '' };
    }
    const reason = 'Demo mode';
    this.log.info(t`ThisIsDemoModeNotSendingOrders`);
    return { success, reason };
  }
}
