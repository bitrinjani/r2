export interface LevelUp {
  close: () => Promise<void>;
  get: (key: string) => Promise<any>;
  put: (key: string, value: any) => any;
  del: (key: string) => any;
  createReadStream: (options: any) => NodeJS.ReadableStream;
  createKeyStream: (options: any) => NodeJS.ReadableStream;
  isClosed: () => boolean;
}

export interface QueryOptions {
  start: Date;
  end: Date;
}
