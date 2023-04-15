import type { ChronoDB, TimeSeries } from "./chrono";
import type { HistoricalOrderStore, Order } from "./types";

import { EventEmitter } from "events";

import { reviveOrder } from "./orderImpl";


class EmittableHistoricalOrderStore extends EventEmitter implements HistoricalOrderStore {
  private readonly timeSeries: TimeSeries<Order>;

  constructor(chronoDB: ChronoDB) {
    super();
    this.timeSeries = chronoDB.getTimeSeries<Order>("HistoricalOrder", order => reviveOrder(order));
  }

  get(key: string): Promise<Order> {
    return this.timeSeries.get(key);
  }

  getAll(): Promise<{ key: string, value: Order }[]> {
    return this.timeSeries.getAll();
  }

  put(value: Order): Promise<string> {
    this.emit("change");
    return this.timeSeries.put(value);
  }

  del(key: string): Promise<void> {
    this.emit("change");
    return this.timeSeries.del(key);
  }

  delAll(): Promise<void> {
    this.emit("change");
    return this.timeSeries.delAll();
  }
}

export const getHistoricalOrderStore = (chronoDB: ChronoDB): HistoricalOrderStore =>
  new EmittableHistoricalOrderStore(chronoDB);
