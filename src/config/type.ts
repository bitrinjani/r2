import type { Static } from "@sinclair/typebox";

import { Type } from "@sinclair/typebox";

const StabilityTrackerConfig = Type.Object({
  threshold: Type.Number({ default: 8 }),
  recoveryInterval: Type.Number({ default: 300000 }),
});

const OnSingleLegConfig = Type.Object({
  action: Type.Union([
    Type.Literal("Cancel"),
    Type.Literal("Reverse"),
    Type.Literal("Proceed"),
  ]),
  actionOnExit: Type.Union([
    Type.Literal("Cancel"),
    Type.Literal("Reverse"),
    Type.Literal("Proceed"),
  ]),
  options: Type.Object({
    limitMovePercent: Type.Number(),
    ttl: Type.Number(),
  }),
});

const AnalyticsConfig = Type.Object({
  enabled: Type.Boolean({ default: false }),
  plugin: Type.Optional(Type.String()),
  initialHistory: Type.Optional(Type.Object({
    minutes: Type.Number({ default: 30 }),
  })),
});

const WebGatewayConfig = Type.Object({
  enabled: Type.Boolean({ default: false }),
  host: Type.RegEx(/^https?:\/\/[\w!?/+\-_~;.,*&@#$%()'[\]]+$/),
  openBrowser: Type.Boolean({ default: true }),
});

const LoggingConfig = Type.Optional(Type.Object({
  webhook: Type.Optional(Type.Object({
    enabled: Type.Boolean({ default: false }),
    payload: Type.String(),
    keywords: Type.Array(Type.String()),
  })),
  line: Type.Optional(Type.Object({
    enabled: Type.Boolean({ default: false }),
    keywords: Type.Array(Type.String()),
  })),
}));

const BrokerConfig = Type.Object({
  broker: Type.String(),
  enabled: Type.Boolean(),
  maxLongPosition: Type.Number(),
  maxShortPosition: Type.Number(),
  cashMarginType: Type.Optional(Type.Union([
    Type.Literal("Cash"),
    Type.Literal("MarginOpen"),
    Type.Literal("NetOut"),
  ])),
  leverageLevel: Type.Number(),
  commissionPercent: Type.Number(),
  noTradePeriods: Type.Optional(Type.Array(
    Type.Array(Type.String())
  )),
});

export const ConfigRoot = Type.Object({
  language: Type.Union([
    Type.Literal("en"),
    Type.Literal("ja"),
  ], { default: "en" }),
  demoMode: Type.Boolean({ default: true }),
  debug: Type.Boolean({ default: false }),
  symbol: Type.String({ minLength: 7, default: "BTC/JPY" }),
  priceMergeSize: Type.Number({ default: 100 }),
  maxSize: Type.Number({ default: 0.01 }),
  minSize: Type.Number({ default: 0.01 }),
  minTargetProfitPercent: Type.Optional(Type.Number({ maximum: 100, default: 1 })),
  maxTargetProfit: Type.Optional(Type.Number()),
  maxTargetProfitPercent: Type.Optional(Type.Number({ maximum: 100 })),
  exitNetProfitRatio: Type.Number({ maximum: 100, default: 20 }),
  maxTargetVolumePercent: Type.Optional(Type.Number({ maximum: 100, default: 50 })),
  acceptablePriceRange: Type.Optional(Type.Number({ maximum: 100 })),
  iterationInterval: Type.Number({ default: 3000 }),
  positionRefreshInterval: Type.Number({ default: 5000 }),
  sleepAfterSend: Type.Number({ default: 5000 }),
  maxNetExposure: Type.Number({ default: 0.1 }),
  maxRetryCount: Type.Number({ default: 10 }),
  orderStatusCheckInterval: Type.Number({ default: 3000 }),
  onSingleLeg: OnSingleLegConfig,
  stabilityTracker: StabilityTrackerConfig,
  analytics: AnalyticsConfig,
  webGateway: WebGatewayConfig,
  logging: Type.Optional(LoggingConfig),
  brokers: Type.Array(BrokerConfig),
});

export type BrokerConfigType = Static<typeof BrokerConfig>;
export type ConfigRootType = Static<typeof ConfigRoot>;
export type AnalyticsConfigType = Static<typeof AnalyticsConfig>;
