import "reflect-metadata";
import type { BrokerConfigType, FormedConfigRootType } from "./";

import { injectable } from "inversify";
import _ from "lodash";

import { findBrokerConfig } from "./";
import t from "../i18n";

@injectable()
export class ConfigValidator {
  validate(config: FormedConfigRootType): void {
    const enabledBrokers = config.brokers.filter(b => b.enabled);
    this.throwIf(enabledBrokers.length < 2, t`AtLeastTwoBrokersMustBeEnabled`);
    this.mustBePositive(config.iterationInterval, "iterationInterval");
    this.mustBePositive(config.maxNetExposure, "maxNetExposure");
    this.mustBePositive(config.maxRetryCount, "maxRetryCount");
    this.mustBeGreaterThanZero(config.maxSize, "maxSize");
    this.mustBeGreaterThanZero(config.minSize, "minSize");
    this.mustBeGreaterThanZero(config.minTargetProfit, "minTargetProfit");
    this.mustBePositive(config.orderStatusCheckInterval, "orderStatusCheckInterval");
    this.mustBePositive(config.positionRefreshInterval, "positionRefreshInterval");
    this.mustBePositive(config.priceMergeSize, "priceMergeSize");
    this.mustBePositive(config.sleepAfterSend, "sleepAfterSend");

    const bitflyer = findBrokerConfig("Bitflyer");
    if(this.isEnabled(bitflyer)){
      this.throwIf(bitflyer.cashMarginType !== "Cash", "CashMarginType must be Cash for Bitflyer.");
      this.validateBrokerConfigCommon(bitflyer);
    }

    const coincheck = findBrokerConfig("Coincheck");
    if(this.isEnabled(coincheck)){
      const allowedCashMarginType = ["Cash", "MarginOpen", "NetOut"];
      this.throwIf(
        !_.includes(allowedCashMarginType, coincheck.cashMarginType),
        "CashMarginType must be Cash, NetOut or MarginOpen for Coincheck."
      );
      this.validateBrokerConfigCommon(coincheck);
    }

    const quoine = findBrokerConfig("Quoine");
    if(this.isEnabled(quoine)){
      const allowedCashMarginType = ["Cash", "NetOut"];
      this.throwIf(
        !_.includes(allowedCashMarginType, quoine.cashMarginType),
        "CashMarginType must be Cash or NetOut for Quoine."
      );
      this.validateBrokerConfigCommon(quoine);
    }
  }

  private mustBePositive(n: number, name: string): void {
    this.throwIf(n <= 0, `${name} must be positive.`);
  }

  private mustBeGreaterThanZero(n: number, name: string): void {
    this.throwIf(n < 0, `${name} must be zero or positive.`);
  }

  private validateBrokerConfigCommon(brokerConfig: BrokerConfigType): void {
    this.mustBeGreaterThanZero(brokerConfig.maxLongPosition, "maxLongPosition");
    this.mustBeGreaterThanZero(brokerConfig.maxShortPosition, "maxShortPosition");
  }

  private isEnabled(brokerConfig?: BrokerConfigType): boolean {
    return brokerConfig !== undefined && brokerConfig.enabled;
  }

  private throwIf(condition: boolean, message: string): void {
    if(condition){
      throw new Error(message);
    }
  }
}
