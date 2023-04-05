import { Level } from 'level';
import mkdirp from 'mkdirp';
import { LevelUp } from "./types";
import { TimeSeries } from './TimeSeries';

export class ChronoDB {
  private readonly store: LevelUp;

  constructor(path: string) {
    mkdirp.sync(path);
    this.store = new Level(path, { keyEncoding: 'utf-8', valueEncoding: 'json' });
  }

  getTimeSeries<T>(name: string, reviver?: (o: T) => T) {
    return new TimeSeries<T>(this.store, name, reviver);
  }

  getUnderlyingStore(): LevelUp {
    return this.store;
  }

  async close(): Promise<void> {
    await this.store.close();
  }
}