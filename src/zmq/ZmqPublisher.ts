import type { EventEmitter } from "events";

import { socket } from "zeromq";

interface PubSocket extends EventEmitter {
  bindSync: (url: string) => void;
  send: (topicAndData: [string, string]) => void;
  unbindSync: (url: string) => void;
  close: () => void;
}

export default class ZmqPublisher {
  private readonly socket: PubSocket;
  
  constructor(private readonly url: string) {
    this.socket = socket("pub");
    this.socket.bindSync(this.url);
  }

  publish<T>(topic: string, data: T): void {
    this.socket.send([topic, JSON.stringify(data)]);
  }

  dispose() {
    this.socket.unbindSync(this.url);
    this.socket.close();
  }
}
