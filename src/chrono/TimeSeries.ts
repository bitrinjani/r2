import type { LevelUp, QueryOptions } from "./types";

import _ from "lodash";
import * as through2 from "through2";
import { v1 as uuid } from "uuid";


const firstUuid = "00000000-0000-0000-0000-000000000000";
const lastUuid = "ffffffff-ffff-ffff-ffff-ffffffffffff";
const firstTimestamp = "0000000000000";
const lastTimestamp = "9999999999999";

export class TimeSeries<T> {
  private readonly queryAll = {
    gt: `${this.name}/${firstTimestamp}/${firstUuid}`,
    lt: `${this.name}/${lastTimestamp}/${lastUuid}`,
  };

  constructor(
    private readonly store: LevelUp,
    private readonly name: string,
    private readonly reviver?: (original: T) => T
  ) {}

  async get(key: string): Promise<T> {
    const value = await this.store.get(key);
    return this.reviver ? this.reviver(value) : value;
  }

  getAll(): Promise<{ key: string, value: T }[]> {
    const kvArray: { key: string, value: T }[] = [];
    return new Promise((resolve, reject) =>
      this.store
        .createReadStream(this.queryAll)
        .on("data", kv =>
          kvArray.push({
            key: kv.key,
            value: this.reviver ? this.reviver(kv.value) : kv.value,
          })
        )
        .on("end", () => resolve(kvArray))
        .on("error", reject)
    );
  }

  query(options: QueryOptions): Promise<{ key: string, value: T }[]> {
    const kvArray: { key: string, value: T }[] = [];
    const gt = `${this.name}/${this.dateToTimestamp(options.start)}/${firstUuid}`;
    const lt = `${this.name}/${this.dateToTimestamp(options.end)}/${lastUuid}`;
    return new Promise((resolve, reject) =>
      this.store
        .createReadStream({ gt, lt })
        .on("data", kv =>
          kvArray.push({
            key: kv.key,
            value: this.reviver ? this.reviver(kv.value) : kv.value,
          })
        )
        .on("end", () => resolve(kvArray))
        .on("error", reject)
    );
  }

  queryStream(options: QueryOptions): NodeJS.ReadableStream {
    const gt = `${this.name}/${this.dateToTimestamp(options.start)}/${firstUuid}`;
    const lt = `${this.name}/${this.dateToTimestamp(options.end)}/${lastUuid}`;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    return this.store.createReadStream({ gt, lt }).pipe(
      through2.obj(function(kv: any) {
        // eslint-disable-next-line @typescript-eslint/no-invalid-this
        this.push({
          key: kv.key,
          value: that.reviver ? that.reviver(kv.value) : kv.value,
        });
      })
    );
  }

  async put(value: T, date?: Date): Promise<string> {
    const key = this.generateKey(date);
    await this.store.put(key, value);
    return key;
  }

  async del(key: string): Promise<void> {
    await this.store.del(key);
  }

  async delAll(): Promise<void> {
    return new Promise<void>((resolve, reject) =>
      this.store
        .createKeyStream(this.queryAll)
        .on("data", key => this.store.del(key))
        .on("end", () => resolve())
        .on("error", reject)
    );
  }

  private generateKey(date: Date = new Date()) {
    return `${this.name}/${this.dateToTimestamp(date)}/${uuid()}`;
  }

  private dateToTimestamp(date: Date): string {
    return _.padStart(String(date.valueOf()), 13, "0");
  }
}
