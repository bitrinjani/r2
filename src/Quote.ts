import * as _ from 'lodash';
import { Broker, QuoteSide } from './types';
import { padStart, padEnd } from './util';

export default class Quote {
  constructor(
    readonly broker: Broker,
    readonly side: QuoteSide,
    readonly price: number,
    readonly volume: number
  ) { }

  toString(): string {
    return `${padEnd(Broker[this.broker], 10)} ${QuoteSide[this.side]} ` +
      `${padStart(this.price.toLocaleString(), 7)} ${_.round(this.volume, 3)}`;
  }
}