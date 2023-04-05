import { Level } from 'level';
import mkdirp from 'mkdirp';
import { LevelUp } from './types';
import { TimeSeries } from './TimeSeries';
import { EntryStream, KeyStream } from 'level-read-stream';
import { Readable } from 'stream';

export class ChronoDB {
  private readonly store: LevelUp;

  constructor(path: string) {
    mkdirp.sync(path);
    const store = new Level(path, { keyEncoding: 'utf-8', valueEncoding: 'json' });
    this.store = {
      put: store.put.bind(store),
      del: store.del.bind(store),
      get: store.get.bind(store),
      isClosed: () => store.status === 'closing' || store.status === 'closed',
      close: store.close.bind(store),
      createReadStream: (options) => {
        return new EntryStream(options) as unknown as Readable;
      },
      createKeyStream: (options) => {
        return new KeyStream(options) as unknown as Readable;
      },
    };
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
