import * as ccxt from 'ccxt';
import { includes } from 'lodash';
import { BrokerRule, CashMarginType } from '../types';
import Broker from './Broker';

export default class CCXTBrokerFactory {
  create(broker: string) {
    if (!this.has(broker)) {
      return ;
    }
    return new Broker(broker);
  }

  has(broker: string) {
    return includes(ccxt.exchanges, broker);
  }

  static brokerRules(): BrokerRule[] {
    const rules = ccxt.exchanges.map((broker) => {
      return {
        id: broker,
        allowedCashMarginType: [CashMarginType.Cash]
      };
    });
    return rules;
  }
}