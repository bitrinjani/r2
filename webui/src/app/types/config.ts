import type { CashMarginType } from "./types";

export interface BrokerConfigType {
  broker: string;
  enabled: boolean;
  maxLongPosition: number;
  maxShortPosition: number;
  cashMarginType: CashMarginType;
  leverageLevel: number;
  commissionPercent: number;
}

export class BrokerConfig implements BrokerConfigType {
  broker: string;
  enabled: boolean;
  maxLongPosition: number;
  maxShortPosition: number;
  cashMarginType: CashMarginType;
  leverageLevel: number;
  commissionPercent: number;
  noTradePeriods: string[][];
}

export class SlackConfig {
  enabled: boolean;
  url: string;
  channel: string;
  username: string;
  keywords: string[];
}

export class LineConfig {
  enabled: boolean;
  token: string;
  keywords: string[];
}

export class LoggingConfig {
  slack: SlackConfig;
  line: LineConfig;
}

export class OnSingleLegConfig {
  action: "Cancel" | "Reverse" | "Proceed";
  actionOnExit: "Cancel" | "Reverse" | "Proceed";
  options: CancelOption | ReverseOption | ProceedOption;
}

export type CancelOption = Record<string, never>;

export class ReverseOption {
  limitMovePercent: number;
  ttl: number;
}

export class ProceedOption {
  limitMovePercent: number;
  ttl: number;
}

export class AnalyticsConfig {
  enabled: boolean;
  plugin: string;
  initialHistory: object;
}

export class WebGatewayConfig {
  enabled: boolean;
}

export class StabilityTrackerConfig {
  threshold: number;
  recoveryInterval: number;
}

export class ConfigRoot {
  language: string;
  demoMode: boolean;
  debug: boolean;
  symbol: string;
  priceMergeSize: number;
  maxSize: number;
  minSize: number;
  minTargetProfit: number;
  minExitTargetProfit: number;
  minTargetProfitPercent: number;
  minExitTargetProfitPercent: number;
  exitNetProfitRatio: number;
  maxTargetProfit: number;
  maxTargetProfitPercent: number;
  maxTargetVolumePercent: number;
  acceptablePriceRange: number;
  iterationInterval: number;
  positionRefreshInterval: number;
  sleepAfterSend: number;
  maxNetExposure: number;
  maxRetryCount: number;
  orderStatusCheckInterval: number;
  stabilityTracker: StabilityTrackerConfig;
  onSingleLeg: OnSingleLegConfig;
  analytics: AnalyticsConfig;
  webGateway: WebGatewayConfig;
  brokers: BrokerConfig[];
  logging: LoggingConfig;
}
