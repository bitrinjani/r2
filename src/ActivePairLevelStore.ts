import { ActivePairStore, OrderPair } from './types';
import { reviveOrder } from './orderImpl';
import { ChronoDB, TimeSeries } from './chrono';
import { EventEmitter } from 'events';

class EmittableActivePairStore extends EventEmitter implements ActivePairStore {
  timeSeries: TimeSeries<OrderPair>;

  constructor(chronoDB: ChronoDB) {
    super();
    this.timeSeries = chronoDB.getTimeSeries<OrderPair>(
      'ActivePair',
      orderPair => orderPair.map(o => reviveOrder(o)) as OrderPair
    );
  }

  get(key: string): Promise<OrderPair> {
    return this.timeSeries.get(key);
  }

  getAll(): Promise<{ key: string; value: OrderPair }[]> {
    return this.timeSeries.getAll();
  }

  put(value: OrderPair): Promise<string> {
    this.emit('change');
    return this.timeSeries.put(value);
  }

  del(key: string): Promise<void> {
    this.emit('change');
    return this.timeSeries.del(key);
  }

  delAll(): Promise<{}> {
    this.emit('change');
    return this.timeSeries.delAll();
  }
}

export const getActivePairStore = (chronoDB: ChronoDB): ActivePairStore => new EmittableActivePairStore(chronoDB);
