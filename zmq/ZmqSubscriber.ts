import { socket } from 'zeromq';
import { EventEmitter } from 'events';
import { parseBuffer } from './util';

interface SubSocket extends EventEmitter {
  connect: (url: string) => void;
  disconnect: (url: string) => void;
  subscribe: (filter: string) => void;
  unsubscribe: (filter: string) => void;
  close: () => void;
}

export default class ZmqSubscriber {
  private socket: SubSocket;

  constructor(private readonly url: string) {
    this.socket = socket('sub');
    this.socket.connect(this.url);
  }

  subscribe<T>(topic: string, handler: (message: T | undefined) => void) {
    this.socket.subscribe(topic);
    this.socket.on('message', (topicBuffer: Buffer, messageBuffer: Buffer) => {
      if (topicBuffer.toString() !== topic) {
        return;
      }
      const message = parseBuffer<T>(messageBuffer);
      handler(message);
    })
  }

  unsubscribe(topic: string) {
    this.socket.unsubscribe(topic);
  }

  dispose() {
    this.socket.disconnect(this.url);
    this.socket.close();
  }
}