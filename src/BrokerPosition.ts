import { Broker } from './type';
import * as _ from 'lodash';
import intl from './intl';
import { padStart, padEnd } from './util';

export default class BrokerPosition {
  broker: Broker;
  get longAllowed(): boolean { return this.allowedLongSize > 0; }
  get shortAllowed(): boolean { return this.allowedShortSize > 0; }
  btc: number;
  allowedLongSize: number;
  allowedShortSize: number;
  toString(): string {
    const isOk = b => b ? 'OK' : 'NG';
    return `${padEnd(Broker[this.broker], 10)}: ${padStart(_.round(this.btc, 3), 5)} BTC, ` +
      `${intl.t('LongAllowed')}: ${isOk(this.longAllowed)}, ` +
      `${intl.t('ShortAllowed')}: ${isOk(this.shortAllowed)}`;
  }
}