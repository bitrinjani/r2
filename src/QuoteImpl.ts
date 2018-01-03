import * as _ from 'lodash';
import { Broker, QuoteSide, Quote } from './types';
import { padStart, padEnd } from './util';

export default class QuoteImpl implements Quote {
  constructor(readonly broker: Broker, readonly side: QuoteSide, readonly price: number, readonly volume: number) {}

  toString(): string {
    return (
      `${padEnd(this.broker, 10)} ${this.side} ` +
      `${padStart(this.price.toLocaleString(), 7)} ${_.round(this.volume, 3)}`
    );
  }
}
