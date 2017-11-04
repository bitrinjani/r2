import { ConfigRoot, ConfigValidator, BrokerConfig, Broker, CashMarginType } from './type';
import intl from './intl';
import * as _ from 'lodash';
import { injectable } from 'inversify';

@injectable()
export default class ConfigValidatorImpl implements ConfigValidator {
  validate(config: ConfigRoot): void {
    const enabledBrokers = config.brokers.filter(b => b.enabled);
    this.throwIf(enabledBrokers.length < 2, intl.t('AtLeastTwoBrokersMustBeEnabled'));
    this.mustBePositive(config.iterationInterval, 'iterationInterval');
    this.mustBePositive(config.maxNetExposure, 'maxNetExposure');
    this.mustBePositive(config.maxRetryCount, 'maxRetryCount');
    this.mustBeGreaterThanZero(config.maxSize, 'maxSize');
    this.mustBeGreaterThanZero(config.minSize, 'minSize');
    this.throwIf(config.minSize < 0.01, 'minSize must be greater than 0.01.');
    this.mustBePositive(config.minTargetProfit, 'minTargetProfit');
    this.mustBePositive(config.orderStatusCheckInterval, 'orderStatusCheckInterval');
    this.mustBePositive(config.positionRefreshInterval, 'positionRefreshInterval');
    this.mustBePositive(config.priceMergeSize, 'priceMergeSize');
    this.mustBePositive(config.sleepAfterSend, 'sleepAfterSend');

    const bitflyer = _.find(config.brokers, b => b.broker === Broker.Bitflyer) as BrokerConfig;
    if (this.isEnabled(bitflyer)) {
      this.throwIf(bitflyer.cashMarginType !== CashMarginType.Cash,
        'CashMarginType must be Cash for Bitflyer.');
      this.validateBrokerConfigCommon(bitflyer);
    }

    const coincheck = _.find(config.brokers, b => b.broker === Broker.Coincheck) as BrokerConfig;
    if (this.isEnabled(coincheck)) {
      const allowedCashMarginType = [CashMarginType.Cash, CashMarginType.MarginOpen];
      this.throwIf(!_.includes(allowedCashMarginType, coincheck.cashMarginType),
        'CashMarginType must be Cash or MarginOpen for Coincheck.');
      this.validateBrokerConfigCommon(coincheck);
    }

    const quoine = _.find(config.brokers, b => b.broker === Broker.Quoine) as BrokerConfig;
    if (this.isEnabled(quoine)) {
      this.throwIf(quoine.cashMarginType !== CashMarginType.NetOut,
        'CashMarginType must be NetOut for Quoine.');
      this.validateBrokerConfigCommon(quoine);
    }
  }

  private mustBePositive(n: number, name: string): void {
    this.throwIf(n <= 0, `${name} must be positive.`);
  }

  private mustBeGreaterThanZero(n: number, name: string): void {
    this.throwIf(n < 0, `${name} must be zero or positive.`);
  }

  private validateBrokerConfigCommon(brokerConfig: BrokerConfig): void {
    this.mustBeGreaterThanZero(brokerConfig.maxLongPosition, 'maxLongPosition');
    this.mustBeGreaterThanZero(brokerConfig.maxShortPosition, 'maxShortPosition');
  }

  private isEnabled(brokerConfig?: BrokerConfig): boolean {
    return brokerConfig !== undefined && brokerConfig.enabled;
  }

  private throwIf(condition: boolean, message: string): void {
    if (condition) {
      throw new Error(message);
    }
  }
}