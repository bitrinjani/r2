import { HistoricalOrderStore, Order } from './types';
import { reviveOrder } from './OrderImpl';
import { ChronoDB, TimeSeries } from '@bitr/chronodb';
import { EventEmitter } from 'events';

class EmittableHistoricalOrderStore extends EventEmitter implements HistoricalOrderStore {
  private readonly timeSeries: TimeSeries<Order>;

  constructor(chronoDB: ChronoDB) {
    super();
    this.timeSeries = chronoDB.getTimeSeries<Order>('HistoricalOrder', order => reviveOrder(order));
  }

  get(key: string): Promise<Order> {
    return this.timeSeries.get(key);
  }

  getAll(): Promise<{ key: string; value: Order }[]> {
    return this.timeSeries.getAll();
  }

  put(value: Order): Promise<string> {
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

export const getHistoricalOrderStore = (chronoDB: ChronoDB): HistoricalOrderStore =>
  new EmittableHistoricalOrderStore(chronoDB);
