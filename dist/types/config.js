"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigRoot = exports.StabilityTrackerConfig = exports.WebGatewayConfig = exports.AnalyticsConfig = exports.ProceedOption = exports.ReverseOption = exports.OnSingleLegConfig = exports.LoggingConfig = exports.LineConfig = exports.SlackConfig = exports.BrokerConfig = void 0;
const castable_1 = require("@bitr/castable");
const index_1 = require("./index");
class BrokerConfig extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], BrokerConfig.prototype, "broker", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], BrokerConfig.prototype, "npmPath", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], BrokerConfig.prototype, "enabled", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], BrokerConfig.prototype, "key", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], BrokerConfig.prototype, "secret", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], BrokerConfig.prototype, "maxLongPosition", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], BrokerConfig.prototype, "maxShortPosition", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], BrokerConfig.prototype, "cashMarginType", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], BrokerConfig.prototype, "leverageLevel", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], BrokerConfig.prototype, "commissionPercent", void 0);
__decorate([
    castable_1.cast,
    (0, castable_1.element)(Array, String),
    __metadata("design:type", Array)
], BrokerConfig.prototype, "noTradePeriods", void 0);
exports.BrokerConfig = BrokerConfig;
class SlackConfig extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], SlackConfig.prototype, "enabled", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SlackConfig.prototype, "url", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SlackConfig.prototype, "channel", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], SlackConfig.prototype, "username", void 0);
__decorate([
    castable_1.cast,
    (0, castable_1.element)(String),
    __metadata("design:type", Array)
], SlackConfig.prototype, "keywords", void 0);
exports.SlackConfig = SlackConfig;
class LineConfig extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], LineConfig.prototype, "enabled", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], LineConfig.prototype, "token", void 0);
__decorate([
    castable_1.cast,
    (0, castable_1.element)(String),
    __metadata("design:type", Array)
], LineConfig.prototype, "keywords", void 0);
exports.LineConfig = LineConfig;
class LoggingConfig extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", SlackConfig)
], LoggingConfig.prototype, "slack", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", LineConfig)
], LoggingConfig.prototype, "line", void 0);
exports.LoggingConfig = LoggingConfig;
class OnSingleLegConfig extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OnSingleLegConfig.prototype, "action", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], OnSingleLegConfig.prototype, "actionOnExit", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Object)
], OnSingleLegConfig.prototype, "options", void 0);
exports.OnSingleLegConfig = OnSingleLegConfig;
class ReverseOption extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ReverseOption.prototype, "limitMovePercent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ReverseOption.prototype, "ttl", void 0);
exports.ReverseOption = ReverseOption;
class ProceedOption extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ProceedOption.prototype, "limitMovePercent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ProceedOption.prototype, "ttl", void 0);
exports.ProceedOption = ProceedOption;
class AnalyticsConfig extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], AnalyticsConfig.prototype, "enabled", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], AnalyticsConfig.prototype, "plugin", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Object)
], AnalyticsConfig.prototype, "initialHistory", void 0);
exports.AnalyticsConfig = AnalyticsConfig;
class WebGatewayConfig extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], WebGatewayConfig.prototype, "enabled", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], WebGatewayConfig.prototype, "host", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], WebGatewayConfig.prototype, "openBrowser", void 0);
exports.WebGatewayConfig = WebGatewayConfig;
class StabilityTrackerConfig extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], StabilityTrackerConfig.prototype, "threshold", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], StabilityTrackerConfig.prototype, "recoveryInterval", void 0);
exports.StabilityTrackerConfig = StabilityTrackerConfig;
class ConfigRoot extends castable_1.Castable {
}
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], ConfigRoot.prototype, "language", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Boolean)
], ConfigRoot.prototype, "demoMode", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", String)
], ConfigRoot.prototype, "symbol", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "priceMergeSize", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "maxSize", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "minSize", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "minTargetProfit", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "minExitTargetProfit", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "minTargetProfitPercent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "minExitTargetProfitPercent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "exitNetProfitRatio", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "maxTargetProfit", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "maxTargetProfitPercent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "maxTargetVolumePercent", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "acceptablePriceRange", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "iterationInterval", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "positionRefreshInterval", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "sleepAfterSend", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "maxNetExposure", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "maxRetryCount", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", Number)
], ConfigRoot.prototype, "orderStatusCheckInterval", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", StabilityTrackerConfig)
], ConfigRoot.prototype, "stabilityTracker", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", OnSingleLegConfig)
], ConfigRoot.prototype, "onSingleLeg", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", AnalyticsConfig)
], ConfigRoot.prototype, "analytics", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", WebGatewayConfig)
], ConfigRoot.prototype, "webGateway", void 0);
__decorate([
    castable_1.cast,
    (0, castable_1.element)(BrokerConfig),
    __metadata("design:type", Array)
], ConfigRoot.prototype, "brokers", void 0);
__decorate([
    castable_1.cast,
    __metadata("design:type", LoggingConfig)
], ConfigRoot.prototype, "logging", void 0);
exports.ConfigRoot = ConfigRoot;
