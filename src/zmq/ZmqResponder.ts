import { socket } from 'zeromq';
import { parseBuffer } from './util';
import { EventEmitter } from 'events';

interface RepSocket extends EventEmitter {
  bindSync: (url: string) => void;
  send: (message: string) => void;
  unbindSync: (url: string) => void;
  close: () => void;
}

export default class ZmqResponder<Request, Response> {
  private responder: RepSocket;

  constructor(
    private readonly url: string,
    private readonly handler: (request: Request | undefined, respond: (response: Response) => void) => void
  ) {
    this.responder = socket('rep');
    this.responder.on('message', (message: Buffer) => this.parser(message));
    this.responder.bindSync(this.url);
  }

  dispose(): void {
    this.responder.unbindSync(this.url);
    this.responder.close();
  }

  private parser(message: Buffer): void {
    const request = parseBuffer<Request>(message);
    this.handler(request, response => this.respond(response));
  }

  private respond(message: Response): void {
    this.responder.send(JSON.stringify(message));
  }
}
