import * as _ from 'lodash';
import { Broker, QuoteSide } from './type';
import { padStart, padEnd } from './util';

export default class Quote {
  constructor(
    readonly broker: Broker, 
    readonly side: QuoteSide, 
    readonly price: number, 
    readonly volume: number
  ) {
    this.broker = broker;
    this.side = side;
    this.price = price;
    this.volume = volume;
  }

  toString(): string {
    return `${padEnd(Broker[this.broker], 10)} ${QuoteSide[this.side]} ` + 
    `${padStart(this.price.toLocaleString(), 7)} ${_.round(this.volume, 3)}`;
  }
}