import { OrderPair, ActivePairStore, OrderPairKeyValue } from './types';
import Order from './Order';
import { revive } from './util';
import { ChronoDB, TimeSeries } from '@bitr/chronodb';

export default class ActivePairLevelStore implements ActivePairStore {
  timeSeries: TimeSeries<OrderPair>;

  constructor(chronoDB: ChronoDB) {
    this.timeSeries = chronoDB.getTimeSeries<OrderPair>(
      'ActivePair',
      orderPair => orderPair.map(o => revive(Order, o)) as OrderPair
    );
  }

  async get(key: string): Promise<OrderPair> {
    return await this.timeSeries.get(key);
  }

  async getAll(): Promise<OrderPairKeyValue[]> {
    return await this.timeSeries.getAll();
  }

  async put(value: OrderPair): Promise<string> {
    return await this.timeSeries.put(value);
  }

  async del(key: string): Promise<void> {
    await this.timeSeries.del(key);
  }

  async delAll(): Promise<{}> {
    return await this.timeSeries.delAll();
  }
}
