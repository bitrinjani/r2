import { Castable, cast, element } from '@bitr/castable';
import { CashMarginType } from './index';

export interface BrokerConfigType {
  broker: string;
  npmPath?: string;
  enabled: boolean;
  key: string;
  secret: string;
  maxLongPosition: number;
  maxShortPosition: number;
  cashMarginType: CashMarginType;
  leverageLevel: number;
  commissionPercent: number;
}

export class BrokerConfig extends Castable implements BrokerConfigType {
  @cast broker: string;
  @cast npmPath?: string;
  @cast enabled: boolean;
  @cast key: string;
  @cast secret: string;
  @cast maxLongPosition: number;
  @cast maxShortPosition: number;
  @cast cashMarginType: CashMarginType;
  @cast leverageLevel: number;
  @cast commissionPercent: number;
  @cast @element(Array, String) noTradePeriods: string[][];
}

export class SlackConfig extends Castable {
  @cast enabled: boolean;
  @cast url: string;
  @cast channel: string;
  @cast username: string;
  @cast
  @element(String)
  keywords: string[];
}

export class LineConfig extends Castable {
  @cast enabled: boolean;
  @cast token: string;
  @cast
  @element(String)
  keywords: string[];
}

export class LoggingConfig extends Castable {
  @cast slack: SlackConfig;
  @cast line: LineConfig;
}

export class OnSingleLegConfig extends Castable {
  @cast action: 'Cancel' | 'Reverse' | 'Proceed';
  @cast actionOnExit: 'Cancel' | 'Reverse' | 'Proceed';
  @cast options: CancelOption | ReverseOption | ProceedOption;
}

export type CancelOption = {};

export class ReverseOption extends Castable {
  @cast limitMovePercent: number;
  @cast ttl: number;
}

export class ProceedOption extends Castable {
  @cast limitMovePercent: number;
  @cast ttl: number;
}

export class AnalyticsConfig extends Castable {
  @cast enabled: boolean;
  @cast plugin: string;
  @cast initialHistory: object;
}

export class WebGatewayConfig extends Castable {
  @cast enabled: boolean;
  @cast host: string;
  @cast openBrowser: boolean;
}

export class StabilityTrackerConfig extends Castable {
  @cast threshold: number;
  @cast recoveryInterval: number;
}

export class ConfigRoot extends Castable {
  @cast language: string;
  @cast demoMode: boolean;
  @cast symbol: string;
  @cast priceMergeSize: number;
  @cast maxSize: number;
  @cast minSize: number;
  @cast minTargetProfit: number;
  @cast minExitTargetProfit: number;
  @cast minTargetProfitPercent: number;
  @cast minExitTargetProfitPercent: number;
  @cast exitNetProfitRatio: number;
  @cast maxTargetProfit: number;
  @cast maxTargetProfitPercent: number;
  @cast maxTargetVolumePercent: number;
  @cast acceptablePriceRange: number;
  @cast iterationInterval: number;
  @cast positionRefreshInterval: number;
  @cast sleepAfterSend: number;
  @cast maxNetExposure: number;
  @cast maxRetryCount: number;
  @cast orderStatusCheckInterval: number;
  @cast stabilityTracker: StabilityTrackerConfig;
  @cast onSingleLeg: OnSingleLegConfig;
  @cast analytics: AnalyticsConfig;
  @cast webGateway: WebGatewayConfig;
  @cast
  @element(BrokerConfig)
  brokers: BrokerConfig[];
  @cast logging: LoggingConfig;
}