import { injectable, inject } from 'inversify';
import symbols from './symbols';
import { Quote, ConfigStore } from './types';
import QuoteAggregator from './QuoteAggregator';
import { getLogger } from '@bitr/logger';
import * as WebSocket from 'ws';
import { wssPort } from './constants';
import * as _ from 'lodash';

@injectable()
export default class WebGateway {
  private readonly log = getLogger(this.constructor.name);
  private handlerRef: (quotes: Quote[]) => Promise<void>;
  private clients: WebSocket[] = [];

  constructor(
    private readonly quoteAggregator: QuoteAggregator,
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore
  ) {}

  async start() {
    const { webGateway } = this.configStore.config;
    if (webGateway && webGateway.enabled) {
      this.log.debug(`Starting ${this.constructor.name}...`);
      this.handlerRef = this.quoteUpdated.bind(this);
      this.quoteAggregator.on('quoteUpdated', this.handlerRef);
      const wss = new WebSocket.Server({ port: wssPort });
      wss.on('connection', ws => {
        ws.on('message', message => {
          this.log.debug(`Received ${JSON.stringify(message)}.`);
        });
        this.clients.push(ws);
      });
      this.log.debug('Started ${this.constructor.name}.');
    }
  }

  async stop() {
    this.log.debug('Stopping ${this.constructor.name}...');
    this.quoteAggregator.removeListener('quoteUpdated', this.handlerRef);
    this.log.debug('Stopped ${this.constructor.name}.');
  }

  private async quoteUpdated(quotes: Quote[]): Promise<void> {
    for (const client of this.clients) {
      client.send(JSON.stringify({ type: 'quotes', body: quotes }), err => {
        if (err) {
          this.log.debug(err.message);
          _.pull(this.clients, client);
        }
      });
    }
  }
} /* istanbul ignore next */
